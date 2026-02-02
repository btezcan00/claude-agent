/**
 * Google ADK State-Aware Provider
 * 
 * A simpler provider that:
 * 1. Understands entity states and progress
 * 2. Guides users naturally based on what's missing
 * 3. HITL only for critical actions (delete, submit)
 * 4. Lets AI reason naturally with state context
 * 
 * Philosophy:
 * - Minimal system prompt
 * - Entity state awareness built into context
 * - AI decides what to do based on state
 * - No rigid workflow definitions
 */

import {
    LlmAgent,
    FunctionTool,
    Runner,
    InMemorySessionService,
    InMemoryMemoryService,
    Gemini,
} from '@google/adk';
import { Content, createPartFromText, Schema, Type } from '@google/genai';
import {
    AgentProvider,
    AgentMessage,
    AgentTool,
    AgentConfig,
    AgentResponse,
    ToolCall,
    ToolResult,
    StreamCallback,
} from './base-provider';
import { agentLogger } from './logger';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
    buildEntityContext,
    getHITLActions,
    EntityContext,
} from '../entities';

interface MCPToolDefinition {
    name: string;
    description?: string;
    inputSchema?: {
        type: string;
        properties?: Record<string, {
            type?: string;
            description?: string;
            enum?: string[];
            items?: Record<string, unknown>;
        }>;
        required?: string[];
    };
}

/**
 * State-Aware Google ADK Provider
 */
export class GoogleStateAwareProvider extends AgentProvider {
    private modelName: string;
    private apiKey: string;
    private sessionService: InMemorySessionService;
    private memoryService: InMemoryMemoryService;

    // MCP connection
    private mcpClient: Client | null = null;
    private mcpTransport: StdioClientTransport | null = null;
    private mcpTools: MCPToolDefinition[] = [];
    private isConnected = false;

    // HITL actions - these are DESTRUCTIVE and need special handling
    private hitlActions: Set<string>;

    // ADK tools
    private adkTools: FunctionTool[] = [];

    constructor(
        config: AgentConfig,
        tools: AgentTool[],
        apiKey: string,
        private mcpServerCommand: string = 'node',
        private mcpServerArgs: string[] = ['mcp-server/dist/index.js']
    ) {
        super(config, []);
        this.modelName = config.model || 'gemini-2.5-flash';
        this.apiKey = apiKey;
        this.sessionService = new InMemorySessionService();
        this.memoryService = new InMemoryMemoryService();
        this.hitlActions = new Set(getHITLActions());

        agentLogger.log('info', 'state-aware', '🚀 STATE-AWARE PROVIDER CREATED', {
            model: this.modelName,
            hitlActions: Array.from(this.hitlActions),
        });
    }

    getProviderName(): string {
        return 'google-state-aware';
    }

    requiresApproval(action: string): boolean {
        return this.hitlActions.has(action);
    }

    async initialize(): Promise<void> {
        if (this.isConnected) return;

        try {
            agentLogger.log('info', 'state-aware', '🔌 Connecting to MCP...');

            this.mcpTransport = new StdioClientTransport({
                command: this.mcpServerCommand,
                args: this.mcpServerArgs,
                env: { ...process.env, API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000' },
            });

            this.mcpClient = new Client({ name: 'state-aware-client', version: '1.0.0' }, { capabilities: {} });
            await this.mcpClient.connect(this.mcpTransport);
            this.isConnected = true;

            const result = await this.mcpClient.listTools();
            this.mcpTools = result.tools as MCPToolDefinition[];

            agentLogger.log('info', 'state-aware', '✅ MCP CONNECTED', { tools: this.mcpTools.length });

            this.adkTools = this.buildTools();
        } catch (error) {
            agentLogger.log('error', 'state-aware', '❌ MCP failed', { error: String(error) });
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.mcpClient?.close();
            await this.mcpTransport?.close();
        } catch { /* ignore */ }
        this.isConnected = false;
    }

    /**
     * Execute MCP tool
     */
    private async executeMCP(name: string, params: Record<string, unknown>): Promise<{ success: boolean; result: unknown; error?: string }> {
        if (!this.mcpClient) return { success: false, result: null, error: 'Not connected' };

        try {
            const result = await this.mcpClient.callTool({ name, arguments: params });
            const content = result.content;

            if (Array.isArray(content) && content[0]?.type === 'text') {
                try {
                    return { success: !result.isError, result: JSON.parse(content[0].text) };
                } catch {
                    return { success: !result.isError, result: content[0].text };
                }
            }
            return { success: !result.isError, result: content };
        } catch (error) {
            return { success: false, result: null, error: String(error) };
        }
    }

    /**
     * Build ADK tools from MCP tools
     * 
     * SIMPLIFIED: All tools execute directly. 
     * For HITL actions, we mark them in the description so the AI knows to be careful,
     * but we don't block execution. The frontend can add confirmation UI if needed.
     */
    private buildTools(): FunctionTool[] {
        const tools: FunctionTool[] = [];

        for (const mcpTool of this.mcpTools) {
            const isHITL = this.hitlActions.has(mcpTool.name);

            tools.push(new FunctionTool({
                name: mcpTool.name,
                description: mcpTool.description + (isHITL ? ' [DESTRUCTIVE - confirm with user first]' : ''),
                parameters: this.convertSchema(mcpTool.inputSchema),
                execute: async (params) => {
                    const p = (params || {}) as Record<string, unknown>;
                    // Execute directly - let the AI handle confirmation conversationally
                    return this.executeMCP(mcpTool.name, p);
                },
            }));
        }

        return tools;
    }

    private convertSchema(schema?: MCPToolDefinition['inputSchema']): Schema {
        if (!schema?.properties) return { type: Type.OBJECT, properties: {} } as Schema;

        const props: Record<string, Schema> = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            const v = value as { type?: string; description?: string; enum?: string[]; items?: Record<string, unknown> };

            const propSchema: Schema = {
                type: this.mapType(v.type),
                description: v.description,
            } as Schema;

            // Handle enums
            if (v.enum) {
                (propSchema as Record<string, unknown>).enum = v.enum;
            }

            // Handle arrays - MUST include items field for Gemini API
            if (v.type === 'array') {
                (propSchema as Record<string, unknown>).items = {
                    type: this.mapType((v.items as { type?: string })?.type || 'string'),
                };
            }

            props[key] = propSchema;
        }
        return { type: Type.OBJECT, properties: props, required: schema.required || [] } as Schema;
    }

    private mapType(t?: string): Type {
        switch (t) {
            case 'string': return Type.STRING;
            case 'number': case 'integer': return Type.NUMBER;
            case 'boolean': return Type.BOOLEAN;
            case 'array': return Type.ARRAY;
            case 'object': return Type.OBJECT;
            default: return Type.STRING;
        }
    }

    /**
     * Build conversation history string for context
     * This allows the AI to understand the full conversation, not just the last message
     */
    private buildConversationHistory(messages: AgentMessage[]): string {
        if (messages.length <= 1) return '';

        // Include all but the last message (which will be sent as the new message)
        const history = messages.slice(0, -1);
        if (history.length === 0) return '';

        const lines: string[] = ['## Recent Conversation History\n'];
        for (const msg of history.slice(-10)) { // Last 10 messages for context
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            // Truncate long messages
            const content = msg.content.length > 500
                ? msg.content.substring(0, 500) + '...'
                : msg.content;
            lines.push(`**${role}:** ${content}\n`);
        }
        return lines.join('\n');
    }

    /**
     * Build agent with state-aware context
     */
    private buildAgent(entityContext?: EntityContext[], conversationHistory?: string): LlmAgent {
        console.log('\n========== STATE-AWARE: buildAgent ==========');
        console.log('Model:', this.modelName);
        console.log('API Key present:', !!this.apiKey);
        console.log('Config systemPrompt length:', this.config.systemPrompt?.length || 0);
        console.log('Conversation history length:', conversationHistory?.length || 0);
        console.log('Tools count:', this.adkTools.length);

        const gemini = new Gemini({ model: this.modelName, apiKey: this.apiKey });

        // Build the instruction - similar structure to working google-provider
        // Use config.systemPrompt if provided (contains current data context), otherwise use base prompt
        let instruction = this.config.systemPrompt
            ? this.getBasePrompt() + '\n\n' + this.config.systemPrompt
            : this.getBasePrompt();

        // Add conversation history so AI has context
        if (conversationHistory) {
            instruction += '\n\n' + conversationHistory;
        }

        // Add entity state context if available
        if (entityContext && entityContext.length > 0) {
            instruction += '\n\n## Current Entity Context\n';
            for (const ctx of entityContext) {
                instruction += `\n**${ctx.type} (${ctx.id})**: ${ctx.stateName} - ${ctx.completionPercent}% complete`;
                if (ctx.missingFields.length > 0) {
                    instruction += `\n  Missing: ${ctx.missingFields.map(f => f.name).join(', ')}`;
                }
                if (ctx.suggestedAction) {
                    instruction += `\n  Suggested: ${ctx.suggestedAction}`;
                }
            }
        }

        console.log('Final instruction length:', instruction.length);
        console.log('First 500 chars of instruction:', instruction.substring(0, 500));
        console.log('==============================================\n');

        const agent = new LlmAgent({
            name: 'gcmp_assistant',
            model: gemini,
            description: 'GCMP Assistant for managing signals, folders, and cases',
            instruction,
            tools: this.adkTools,
        });

        console.log('Agent created successfully');
        return agent;
    }

    /**
     * Minimal base prompt - focused on being conversationally intelligent
     */
    private getBasePrompt(): string {
        return `You are an assistant for GCMP (Government Case Management Platform).

You help users manage **Signals** (reports of suspicious activity) and **Cases** (case files for investigation).

## HOW TO ASK FOR INFORMATION

**DO NOT use any "ask_clarification" or "plan_proposal" tools - they don't exist!**

When you need more information, just ASK NATURALLY in your response text:
- "I'd be happy to create that signal. Could you tell me where this was observed?"
- "To create the case, I need a few details: What should we name it?"

When you're ready to act, just USE THE REAL TOOLS (signal_create, case_create, etc.)

## UNDERSTANDING FRAGMENTED MESSAGES

Sometimes users provide answers to questions in a condensed format like:
- "John Smith and yes" → means name is "John Smith" AND the answer to yes/no question is "yes"
- "Main Street, fraud, police" → could be location, type, and receivedBy values

When you see such messages, try to map them to your previous questions.

## AVAILABLE TOOLS

You have access to tools like:
- signal_create, signal_list, signal_get, signal_update, signal_delete
- create_case, edit_case, delete_case, assign_case, change_status
- add_note, search_cases, get_case_stats, etc.

Use these REAL tools when you have enough information.

## CRITICAL: INTERPRETING TOOL OUTPUTS

**The tools return raw JSON data. THIS IS NORMAL AND MEANS SUCCESS.**

When you call a tool and get back JSON with an ID field (like \`{"id": "case-123", ...}\` or \`{"id": "GCMP-2026-001234", ...}\`):
- **THE ACTION SUCCEEDED** ✓
- **DO NOT** apologize or say "I encountered an error"
- **DO NOT** retry the same action
- **DO NOT** say "unable to create" or "there's a problem"
- Simply confirm: "I have created [entity] [ID]" and suggest next steps

The large JSON response is just the full entity data - it's not an error!

## CRITICAL RULE 1: NEVER DUPLICATE ACTIONS

**ALWAYS check conversation history before taking any action.**

If the conversation history shows you already:
- Created a signal → DO NOT create another one
- Created a case → DO NOT create another one

**Look for phrases like:**
- "I have created a signal: GCMP-..."
- "Signal created successfully"
- "Done! Created signal..."

If you see these, the action is ALREADY DONE. Ask what's next instead.

## CRITICAL RULE 2: EXECUTE WHEN READY

**Once you have the required information, ACT:**
- User provides details → call the appropriate tool immediately
- User says "yes", "correct", "go ahead" → EXECUTE the action NOW
- Don't keep asking for confirmation

## WORKFLOW AWARENESS

**Signal → Case workflow:**
1. User reports something → Create a Signal (get signal ID like GCMP-2026-XXXXXX)
2. User wants to investigate → Create a Case and link the signal to it
3. DO NOT create a second signal when user asks to "continue" or "what's next"

**Check the "Last Created Signal ID" in the context - if present, a signal was JUST created.**

## RESPONSE STYLE
- Be concise and helpful
- After actions, briefly confirm what happened
- Suggest logical next steps
- If confused, ask ONE clear question`;
    }

    /**
     * Stream message
     */
    async streamMessage(
        messages: AgentMessage[],
        onStream: StreamCallback,
        context?: Record<string, unknown>
    ): Promise<void> {
        if (!this.isConnected) await this.initialize();

        const requestId = agentLogger.requestStart('state-aware', this.modelName, messages.length, 0, this.adkTools.length);

        try {
            // Extract entity context from the provided context
            const entityContext = context?.entities as EntityContext[] | undefined;

            // Build conversation history to include in context
            const conversationHistory = this.buildConversationHistory(messages);

            const agent = this.buildAgent(entityContext, conversationHistory);
            const runner = new Runner({
                appName: 'gcmp-state-aware',
                agent,
                sessionService: this.sessionService,
                memoryService: this.memoryService,
            });

            const session = await runner.sessionService.createSession({
                appName: 'gcmp-state-aware',
                userId: `user-${Date.now()}`,
            });

            const lastMessage = messages[messages.length - 1];
            let currentContent = '';
            const toolCalls: ToolCall[] = [];
            const executedTools: { name: string; result: unknown }[] = [];

            agentLogger.log('debug', 'state-aware', '📡 STARTING STREAM', {
                messageContent: lastMessage.content.substring(0, 100),
                toolCount: this.adkTools.length,
                historyLength: messages.length,
            }, requestId);

            let eventCount = 0;
            console.log('\n========== STATE-AWARE: Starting runAsync ==========');
            console.log('Session ID:', session.id);
            console.log('Conversation history length:', messages.length);
            console.log('Last message:', lastMessage.content.substring(0, 100));

            for await (const event of runner.runAsync({
                userId: session.userId,
                sessionId: session.id,
                newMessage: { role: 'user', parts: [createPartFromText(lastMessage.content)] },
            })) {
                eventCount++;

                // Log FULL event to console for debugging
                console.log(`\n📨 RAW EVENT #${eventCount}:`, JSON.stringify(event, null, 2).substring(0, 1500));

                // Log FULL event for debugging
                agentLogger.log('debug', 'state-aware', `📨 RAW EVENT #${eventCount}`, {
                    fullEvent: JSON.stringify(event, null, 2).substring(0, 1000),
                }, requestId);

                if (event.author === 'user') {
                    console.log('  -> Skipping user event');
                    continue;
                }

                console.log(`  -> Processing event from author: ${event.author}`);
                console.log(`  -> Has content: ${!!event.content}, Parts count: ${event.content?.parts?.length || 0}`);

                agentLogger.log('debug', 'state-aware', `📨 EVENT #${eventCount}`, {
                    author: event.author,
                    hasContent: !!event.content,
                    partsCount: event.content?.parts?.length || 0,
                    partTypes: event.content?.parts?.map(p => Object.keys(p).filter(k => (p as Record<string, unknown>)[k])),
                }, requestId);

                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        // Log each part for debugging
                        console.log(`  📄 PART: text=${!!part.text} (len=${part.text?.length || 0}), functionCall=${!!part.functionCall}, functionResponse=${!!part.functionResponse}`);
                        if (part.text) {
                            console.log(`     Text preview: "${part.text.substring(0, 100)}"`);
                        }
                        agentLogger.log('debug', 'state-aware', `  📄 PART`, {
                            hasText: !!part.text,
                            textLength: part.text?.length || 0,
                            hasFunctionCall: !!part.functionCall,
                            hasFunctionResponse: !!part.functionResponse,
                        }, requestId);

                        if (part.text) {
                            currentContent += part.text;
                            onStream({ type: 'thinking', data: { text: part.text } });
                        }

                        if (part.functionCall?.name) {
                            const name = part.functionCall.name;
                            const input = (part.functionCall.args || {}) as Record<string, unknown>;
                            toolCalls.push({ id: `tool-${Date.now()}`, name, input });
                            onStream({ type: 'tool_call', data: { tool: name, input } });
                        }

                        if (part.functionResponse) {
                            const result = part.functionResponse.response;
                            executedTools.push({ name: part.functionResponse.name || '', result });

                            // Check if this is an approval request
                            const r = result as Record<string, unknown> | undefined;
                            if (r?.status === 'approval_required') {
                                onStream({
                                    type: 'approval_required',
                                    data: {
                                        id: r.approvalId,
                                        action: r.action,
                                        message: r.message,
                                        params: r.params,
                                    },
                                });
                            } else {
                                onStream({ type: 'tool_result', data: { tool: part.functionResponse.name, result } });
                            }
                        }
                    }
                }
            }

            console.log('\n========== STATE-AWARE: Stream Complete ==========');
            console.log('Total events:', eventCount);
            console.log('Content length:', currentContent.length);
            console.log('Content preview:', currentContent.substring(0, 200));
            console.log('Tool calls:', toolCalls.length);
            console.log('Executed tools:', executedTools.length);
            console.log('=================================================\n');

            agentLogger.log('debug', 'state-aware', '📡 STREAM COMPLETE', {
                eventCount,
                contentLength: currentContent.length,
                toolCallCount: toolCalls.length,
                executedToolCount: executedTools.length,
            }, requestId);

            agentLogger.requestComplete(requestId, currentContent, 'stop');
            onStream({ type: 'response', data: { content: currentContent, toolCalls, executedTools } });

        } catch (error) {
            agentLogger.requestError(requestId, error instanceof Error ? error : String(error));
            onStream({ type: 'error', data: { message: String(error) } });
            throw error;
        }
    }

    async sendMessage(messages: AgentMessage[], context?: Record<string, unknown>): Promise<AgentResponse> {
        if (!this.isConnected) await this.initialize();

        let content = '';
        const toolCalls: ToolCall[] = [];

        await this.streamMessage(messages, (event) => {
            const data = event.data as Record<string, unknown>;
            if (event.type === 'thinking' && data?.text) content += data.text;
            if (event.type === 'tool_call' && data) {
                toolCalls.push({ id: `tool-${Date.now()}`, name: data.tool as string, input: data.input as Record<string, unknown> });
            }
        }, context);

        return { content, toolCalls: toolCalls.length > 0 ? toolCalls : undefined, finishReason: 'stop' };
    }

    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const result = await this.executeMCP(toolCall.name, toolCall.input);
        return { tool_call_id: toolCall.id, name: toolCall.name, content: JSON.stringify(result.result), is_error: !result.success };
    }
}

export async function createStateAwareProvider(
    config: AgentConfig,
    apiKey: string,
    mcpCommand?: string,
    mcpArgs?: string[]
): Promise<GoogleStateAwareProvider> {
    const provider = new GoogleStateAwareProvider(config, [], apiKey, mcpCommand, mcpArgs);
    await provider.initialize();
    return provider;
}
