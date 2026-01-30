/**
 * Google ADK Unified Provider with MCP Integration
 * 
 * A clean, minimal provider that:
 * 1. Fetches tools dynamically from MCP server
 * 2. Executes tools via MCP protocol (backend handles API calls)
 * 3. Returns results to Gemini for natural response generation
 * 4. Lets the AI reason naturally without forcing explicit HITL tools
 * 
 * Philosophy:
 * - Minimal system prompts - let Gemini think
 * - Tools come from MCP server (single source of truth)
 * - Backend executes tools, AI processes results
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

/**
 * MCP Tool definition from the server
 */
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
 * Write tool names that should be identified for the AI
 * The AI will naturally propose actions - we just need to know which ones to flag
 */
const WRITE_TOOL_NAMES = new Set([
    'signal_create', 'signal_update', 'signal_delete',
    'signal_add_to_folder', 'signal_remove_from_folder',
    'folder_create', 'folder_update', 'folder_delete',
    'folder_submit_application',
    'create_case', 'edit_case', 'add_note', 'assign_case',
    'unassign_case', 'delete_case', 'change_status',
]);

/**
 * Google ADK Unified Provider
 */
export class GoogleADKUnifiedProvider extends AgentProvider {
    private modelName: string;
    private apiKey: string;
    private sessionService: InMemorySessionService;
    private memoryService: InMemoryMemoryService;

    // MCP client
    private mcpClient: Client | null = null;
    private mcpTransport: StdioClientTransport | null = null;
    private mcpTools: MCPToolDefinition[] = [];
    private isConnected = false;

    // Converted ADK tools
    private adkTools: FunctionTool[] = [];

    // Tool execution results storage (for agentic loop)
    private toolResults: Map<string, unknown> = new Map();

    constructor(
        config: AgentConfig,
        tools: AgentTool[], // Ignored - tools come from MCP
        apiKey: string,
        private mcpServerCommand: string = 'node',
        private mcpServerArgs: string[] = ['mcp-server/dist/index.js']
    ) {
        super(config, []);
        this.modelName = config.model || 'gemini-2.0-flash';
        this.apiKey = apiKey;
        this.sessionService = new InMemorySessionService();
        this.memoryService = new InMemoryMemoryService();

        agentLogger.log('info', 'google', '🚀 ADK UNIFIED PROVIDER CREATED', {
            model: this.modelName,
        });
    }

    getProviderName(): string {
        return 'google-unified';
    }

    /**
     * Check if a tool requires approval (is a write operation)
     */
    requiresApproval(toolName: string): boolean {
        return WRITE_TOOL_NAMES.has(toolName);
    }

    /**
     * Initialize: Connect to MCP and load tools
     */
    async initialize(): Promise<void> {
        if (this.isConnected) return;

        try {
            agentLogger.log('info', 'google', '🔌 Connecting to MCP server...', {
                command: this.mcpServerCommand,
                args: this.mcpServerArgs,
            });

            // Create transport to spawn MCP server
            this.mcpTransport = new StdioClientTransport({
                command: this.mcpServerCommand,
                args: this.mcpServerArgs,
                env: {
                    ...process.env,
                    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
                },
            });

            // Create MCP client
            this.mcpClient = new Client({
                name: 'adk-unified-client',
                version: '1.0.0',
            }, {
                capabilities: {},
            });

            // Connect
            await this.mcpClient.connect(this.mcpTransport);
            this.isConnected = true;

            // Fetch tools from MCP
            const result = await this.mcpClient.listTools();
            this.mcpTools = result.tools as MCPToolDefinition[];

            agentLogger.log('info', 'google', '✅ MCP CONNECTED - Tools loaded', {
                toolCount: this.mcpTools.length,
                tools: this.mcpTools.map(t => t.name),
            });

            // Convert MCP tools to ADK format
            this.adkTools = this.convertMCPToolsToADK();

        } catch (error) {
            agentLogger.log('error', 'google', '❌ Failed to connect to MCP', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Shutdown: Disconnect from MCP
     */
    async shutdown(): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.mcpClient?.close();
            await this.mcpTransport?.close();
        } catch (e) {
            // Ignore shutdown errors
        }
        this.isConnected = false;
        this.mcpClient = null;
        this.mcpTransport = null;
        agentLogger.log('info', 'google', '🔌 MCP disconnected');
    }

    /**
     * Execute a tool via MCP
     */
    private async executeMCPTool(
        toolName: string,
        params: Record<string, unknown>
    ): Promise<{ success: boolean; result: unknown; error?: string }> {
        if (!this.mcpClient || !this.isConnected) {
            return { success: false, result: null, error: 'MCP not connected' };
        }

        try {
            agentLogger.log('debug', 'google', `🔧 Executing via MCP: ${toolName}`, { params });

            const result = await this.mcpClient.callTool({
                name: toolName,
                arguments: params,
            });

            // Parse result
            const content = result.content;
            if (Array.isArray(content) && content.length > 0) {
                const first = content[0];
                if (first.type === 'text' && typeof first.text === 'string') {
                    try {
                        const parsed = JSON.parse(first.text);
                        agentLogger.log('debug', 'google', `✅ MCP result: ${toolName}`, {
                            success: !result.isError,
                            resultPreview: JSON.stringify(parsed).slice(0, 200),
                        });
                        return { success: !result.isError, result: parsed };
                    } catch {
                        return { success: !result.isError, result: first.text };
                    }
                }
            }

            return { success: !result.isError, result: content };
        } catch (error) {
            agentLogger.log('error', 'google', `❌ MCP tool failed: ${toolName}`, {
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                success: false,
                result: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Convert JSON Schema type to Google Schema Type
     */
    private convertType(jsonType: string): Type {
        switch (jsonType) {
            case 'string': return Type.STRING;
            case 'number':
            case 'integer': return Type.NUMBER;
            case 'boolean': return Type.BOOLEAN;
            case 'array': return Type.ARRAY;
            case 'object': return Type.OBJECT;
            default: return Type.STRING;
        }
    }

    /**
     * Convert MCP tool schema to Google Schema
     */
    private convertSchema(inputSchema?: MCPToolDefinition['inputSchema']): Schema {
        if (!inputSchema?.properties) {
            return { type: Type.OBJECT, properties: {} } as Schema;
        }

        const properties: Record<string, Schema> = {};
        for (const [key, prop] of Object.entries(inputSchema.properties)) {
            const propSchema: Schema = {
                type: this.convertType(prop.type || 'string'),
                description: prop.description,
            } as Schema;

            if (prop.enum) {
                (propSchema as Record<string, unknown>).enum = prop.enum;
            }

            if (prop.items && prop.type === 'array') {
                (propSchema as Record<string, unknown>).items = {
                    type: this.convertType((prop.items as { type?: string }).type || 'string'),
                };
            }

            properties[key] = propSchema;
        }

        return {
            type: Type.OBJECT,
            properties,
            required: inputSchema.required || [],
        } as Schema;
    }

    /**
     * Convert MCP tools to ADK FunctionTool format
     */
    private convertMCPToolsToADK(): FunctionTool[] {
        return this.mcpTools.map(mcpTool => {
            return new FunctionTool({
                name: mcpTool.name,
                description: mcpTool.description || `Execute ${mcpTool.name}`,
                parameters: this.convertSchema(mcpTool.inputSchema),
                execute: async (params: unknown) => {
                    const toolParams = (params || {}) as Record<string, unknown>;

                    // Execute via MCP - the backend handles everything
                    const result = await this.executeMCPTool(mcpTool.name, toolParams);

                    // Store result for potential reference
                    this.toolResults.set(mcpTool.name, result);

                    return result;
                },
            });
        });
    }

    /**
     * Build the agent with minimal system prompt
     */
    private buildAgent(): LlmAgent {
        const geminiModel = new Gemini({
            model: this.modelName,
            apiKey: this.apiKey,
        });

        // Minimal system prompt - let Gemini reason naturally
        const systemPrompt = this.config.systemPrompt || this.getDefaultSystemPrompt();

        return new LlmAgent({
            name: 'gcmp_assistant',
            model: geminiModel,
            description: 'GCMP Assistant for managing signals, folders, and cases',
            instruction: systemPrompt,
            tools: this.adkTools,
        });
    }

    /**
     * Default minimal system prompt
     */
    private getDefaultSystemPrompt(): string {
        return `You are a helpful assistant for the GCMP (Gemeentelijk Casemanagementsysteem Platform) system.

You help users manage:
- Signals: Reports of suspicious activities (human trafficking, drug trafficking, etc.)
- Folders: Case files that group related signals and information
- Cases: Investigations with assigned team members

When users want to create or modify data:
1. Gather all required information naturally through conversation
2. Confirm your understanding before making changes
3. Use the available tools to execute actions

Be concise and helpful. If information is missing, ask for it naturally.`;
    }

    /**
     * Send a non-streaming message
     */
    async sendMessage(
        messages: AgentMessage[],
        context?: Record<string, unknown>
    ): Promise<AgentResponse> {
        if (!this.isConnected) await this.initialize();

        const requestId = agentLogger.requestStart(
            'google-unified',
            this.modelName,
            messages.length,
            this.config.systemPrompt?.length || 0,
            this.adkTools.length
        );

        try {
            const agent = this.buildAgent();
            const runner = new Runner({
                appName: 'gcmp-unified',
                agent,
                sessionService: this.sessionService,
                memoryService: this.memoryService,
            });

            const session = await runner.sessionService.createSession({
                appName: 'gcmp-unified',
                userId: `user-${Date.now()}`,
            });

            const lastMessage = messages[messages.length - 1];
            const messageContent: Content = {
                role: 'user',
                parts: [createPartFromText(lastMessage.content)],
            };

            let content = '';
            const toolCalls: ToolCall[] = [];

            for await (const event of runner.runAsync({
                userId: session.userId,
                sessionId: session.id,
                newMessage: messageContent,
            })) {
                if (event.author === 'user') continue;

                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        if (part.text) {
                            content += part.text;
                        }
                        if (part.functionCall?.name) {
                            toolCalls.push({
                                id: `tool-${Date.now()}-${toolCalls.length}`,
                                name: part.functionCall.name,
                                input: (part.functionCall.args || {}) as Record<string, unknown>,
                            });
                        }
                    }
                }
            }

            agentLogger.requestComplete(requestId, content, toolCalls.length > 0 ? 'tool_use' : 'stop');

            return {
                content,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
            };
        } catch (error) {
            agentLogger.requestError(requestId, error instanceof Error ? error : String(error));
            throw error;
        }
    }

    /**
     * Send a streaming message
     */
    async streamMessage(
        messages: AgentMessage[],
        onStream: StreamCallback,
        context?: Record<string, unknown>
    ): Promise<void> {
        if (!this.isConnected) await this.initialize();

        const requestId = agentLogger.requestStart(
            'google-unified',
            this.modelName,
            messages.length,
            this.config.systemPrompt?.length || 0,
            this.adkTools.length
        );

        try {
            const agent = this.buildAgent();
            const runner = new Runner({
                appName: 'gcmp-unified',
                agent,
                sessionService: this.sessionService,
                memoryService: this.memoryService,
            });

            const session = await runner.sessionService.createSession({
                appName: 'gcmp-unified',
                userId: `user-${Date.now()}`,
            });

            const lastMessage = messages[messages.length - 1];
            const messageContent: Content = {
                role: 'user',
                parts: [createPartFromText(lastMessage.content)],
            };

            agentLogger.log('debug', 'google-unified', '📡 STARTING STREAM', {
                messageLength: lastMessage.content.length,
            }, requestId);

            let currentContent = '';
            const toolCalls: ToolCall[] = [];
            const executedTools: { name: string; input: Record<string, unknown>; result: unknown }[] = [];

            for await (const event of runner.runAsync({
                userId: session.userId,
                sessionId: session.id,
                newMessage: messageContent,
            })) {
                // Skip user events
                if (event.author === 'user') continue;

                agentLogger.log('debug', 'google-unified', '📨 ADK EVENT', {
                    author: event.author,
                    hasContent: !!event.content,
                    partsCount: event.content?.parts?.length || 0,
                }, requestId);

                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        // Text content
                        if (part.text) {
                            currentContent += part.text;
                            onStream({
                                type: 'thinking',
                                data: { text: part.text },
                            });
                        }

                        // Function call - ADK already executed it via our execute function
                        if (part.functionCall?.name) {
                            const toolName = part.functionCall.name;
                            const toolInput = (part.functionCall.args || {}) as Record<string, unknown>;

                            const toolCall: ToolCall = {
                                id: `tool-${Date.now()}-${toolCalls.length}`,
                                name: toolName,
                                input: toolInput,
                            };
                            toolCalls.push(toolCall);

                            // Get the result that was stored during execution
                            const result = this.toolResults.get(toolName);

                            // Send tool_executed event - backend already handled it
                            onStream({
                                type: 'tool_executed',
                                data: {
                                    tool: toolName,
                                    input: toolInput,
                                    result: result,
                                    status: 'completed',
                                },
                            });

                            executedTools.push({
                                name: toolName,
                                input: toolInput,
                                result: result,
                            });

                            agentLogger.log('debug', 'google-unified', `✅ Tool executed: ${toolName}`, {
                                hasResult: !!result,
                            }, requestId);
                        }

                        // Function response (result from tool execution)
                        if (part.functionResponse) {
                            agentLogger.log('debug', 'google-unified', '📋 Function response received', {
                                name: part.functionResponse.name,
                            }, requestId);
                        }
                    }
                }
            }

            agentLogger.log('debug', 'google-unified', '📡 STREAM COMPLETE', {
                contentLength: currentContent.length,
                toolCalls: toolCalls.length,
                executedTools: executedTools.length,
            }, requestId);

            agentLogger.requestComplete(requestId, currentContent, toolCalls.length > 0 ? 'tool_use' : 'stop');

            // Send final response
            onStream({
                type: 'response',
                data: {
                    content: currentContent,
                    toolCalls,
                    executedTools,
                },
            });

        } catch (error) {
            agentLogger.requestError(requestId, error instanceof Error ? error : String(error));
            onStream({
                type: 'error',
                data: { message: error instanceof Error ? error.message : String(error) },
            });
            throw error;
        }
    }

    /**
     * Execute a tool (for manual execution if needed)
     */
    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const result = await this.executeMCPTool(toolCall.name, toolCall.input);

        return {
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: JSON.stringify(result.result),
            is_error: !result.success,
        };
    }
}

/**
 * Create and initialize the unified provider
 */
export async function createUnifiedProvider(
    config: AgentConfig,
    apiKey: string,
    mcpServerCommand?: string,
    mcpServerArgs?: string[]
): Promise<GoogleADKUnifiedProvider> {
    const provider = new GoogleADKUnifiedProvider(
        config,
        [],
        apiKey,
        mcpServerCommand,
        mcpServerArgs
    );
    await provider.initialize();
    return provider;
}
