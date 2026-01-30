/**
 * Google ADK Multi-Agent Provider with Workflow Engine
 * 
 * Architecture:
 * 1. Orchestrator Agent - Routes requests, manages conversation
 * 2. Workflow Engine - Executes multi-step flows deterministically
 * 3. Sub-Agents - Specialized agents for different domains
 * 4. HITL Integration - Checkpoints for approvals and input
 * 
 * Flow:
 * User Message → Orchestrator → Detect Intent → 
 *   → Simple Query: Execute tools directly
 *   → Complex Flow: Start workflow → HITL checkpoints → Complete
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
    StreamEvent,
} from './base-provider';
import { agentLogger } from './logger';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
    WorkflowEngine,
    ToolExecutor,
    createWorkflowRegistry,
    allWorkflows,
    WorkflowDefinition,
    WorkflowResponse,
} from '../workflows';

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
 * Read-only tools that can be executed immediately
 */
const READ_TOOLS = new Set([
    'signal_list', 'signal_get', 'signal_search', 'signal_summarize',
    'folder_list', 'folder_get', 'folder_summarize',
    'team_list', 'team_get',
]);

/**
 * Google ADK Multi-Agent Provider
 */
export class GoogleMultiAgentProvider extends AgentProvider {
    private modelName: string;
    private apiKey: string;
    private sessionService: InMemorySessionService;
    private memoryService: InMemoryMemoryService;

    // MCP
    private mcpClient: Client | null = null;
    private mcpTransport: StdioClientTransport | null = null;
    private mcpTools: MCPToolDefinition[] = [];
    private isConnected = false;

    // Workflow Engine
    private workflowEngine: WorkflowEngine;
    private activeWorkflowId: string | null = null;

    // Converted ADK tools
    private adkTools: FunctionTool[] = [];

    constructor(
        config: AgentConfig,
        tools: AgentTool[],
        apiKey: string,
        private mcpServerCommand: string = 'node',
        private mcpServerArgs: string[] = ['mcp-server/dist/index.js']
    ) {
        super(config, []);
        this.modelName = config.model || 'gemini-2.0-flash';
        this.apiKey = apiKey;
        this.sessionService = new InMemorySessionService();
        this.memoryService = new InMemoryMemoryService();

        // Create tool executor wrapper for workflow engine
        const toolExecutor: ToolExecutor = {
            executeTool: async (name: string, params: Record<string, unknown>) => {
                return this.executeMCPTool(name, params);
            }
        };

        // Initialize workflow engine
        const registry = createWorkflowRegistry(allWorkflows);
        this.workflowEngine = new WorkflowEngine(registry, toolExecutor);

        agentLogger.log('info', 'multi-agent', '🚀 MULTI-AGENT PROVIDER CREATED', {
            model: this.modelName,
            workflows: allWorkflows.length,
        });
    }

    getProviderName(): string {
        return 'google-multi-agent';
    }

    requiresApproval(toolName: string): boolean {
        return !READ_TOOLS.has(toolName);
    }

    /**
     * AgentProvider interface - execute a tool call
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

    /**
     * Initialize MCP connection
     */
    async initialize(): Promise<void> {
        if (this.isConnected) return;

        try {
            agentLogger.log('info', 'multi-agent', '🔌 Connecting to MCP server...');

            this.mcpTransport = new StdioClientTransport({
                command: this.mcpServerCommand,
                args: this.mcpServerArgs,
                env: {
                    ...process.env,
                    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
                },
            });

            this.mcpClient = new Client({
                name: 'multi-agent-client',
                version: '1.0.0',
            }, { capabilities: {} });

            await this.mcpClient.connect(this.mcpTransport);
            this.isConnected = true;

            const result = await this.mcpClient.listTools();
            this.mcpTools = result.tools as MCPToolDefinition[];

            agentLogger.log('info', 'multi-agent', '✅ MCP CONNECTED', {
                toolCount: this.mcpTools.length,
            });

            // Build ADK tools (read tools + workflow tools)
            this.adkTools = this.buildADKTools();

        } catch (error) {
            agentLogger.log('error', 'multi-agent', '❌ MCP connection failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.mcpClient?.close();
            await this.mcpTransport?.close();
        } catch {
            // Ignore
        }
        this.isConnected = false;
        this.mcpClient = null;
        this.mcpTransport = null;
    }

    /**
     * Execute tool via MCP
     */
    private async executeMCPTool(
        toolName: string,
        params: Record<string, unknown>
    ): Promise<{ success: boolean; result: unknown; error?: string }> {
        if (!this.mcpClient || !this.isConnected) {
            return { success: false, result: null, error: 'MCP not connected' };
        }

        try {
            agentLogger.log('debug', 'multi-agent', `🔧 MCP: ${toolName}`, { params });

            const result = await this.mcpClient.callTool({
                name: toolName,
                arguments: params,
            });

            const content = result.content;
            if (Array.isArray(content) && content.length > 0) {
                const first = content[0];
                if (first.type === 'text' && typeof first.text === 'string') {
                    try {
                        return { success: !result.isError, result: JSON.parse(first.text) };
                    } catch {
                        return { success: !result.isError, result: first.text };
                    }
                }
            }
            return { success: !result.isError, result: content };
        } catch (error) {
            return {
                success: false,
                result: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Build ADK tools: read tools from MCP + workflow management tools
     */
    private buildADKTools(): FunctionTool[] {
        const tools: FunctionTool[] = [];

        // 1. Add read-only MCP tools (AI can call directly)
        for (const mcpTool of this.mcpTools) {
            if (READ_TOOLS.has(mcpTool.name)) {
                tools.push(new FunctionTool({
                    name: mcpTool.name,
                    description: mcpTool.description || `Execute ${mcpTool.name}`,
                    parameters: this.convertSchema(mcpTool.inputSchema),
                    execute: async (params) => {
                        return this.executeMCPTool(mcpTool.name, (params || {}) as Record<string, unknown>);
                    },
                }));
            }
        }

        // 2. Add workflow tools (AI uses these for write operations)
        tools.push(this.createStartWorkflowTool());
        tools.push(this.createRespondToHITLTool());
        tools.push(this.createListWorkflowsTool());

        return tools;
    }

    /**
     * Create the start_workflow tool
     */
    private createStartWorkflowTool(): FunctionTool {
        return new FunctionTool({
            name: 'start_workflow',
            description: `Start a workflow for multi-step operations. Available workflows:
${allWorkflows.map(w => `- ${w.id}: ${w.description}`).join('\n')}

Use this for write operations (create, update, delete). The workflow will guide you through required steps with approval checkpoints.`,
            parameters: {
                type: Type.OBJECT,
                properties: {
                    workflow_id: {
                        type: Type.STRING,
                        description: 'ID of the workflow to start',
                        enum: allWorkflows.map(w => w.id),
                    },
                    inputs: {
                        type: Type.OBJECT,
                        description: 'Input values for the workflow',
                    },
                },
                required: ['workflow_id'],
            } as Schema,
            execute: async (params) => {
                const p = params as { workflow_id: string; inputs?: Record<string, unknown> };
                const response = await this.workflowEngine.startWorkflow(
                    p.workflow_id,
                    p.inputs || {},
                    {}
                );

                if (response.status !== 'failed') {
                    this.activeWorkflowId = response.executionId;
                }

                return response;
            },
        });
    }

    /**
     * Create the respond_to_hitl tool
     */
    private createRespondToHITLTool(): FunctionTool {
        return new FunctionTool({
            name: 'respond_to_hitl',
            description: 'Respond to a Human-in-the-Loop checkpoint. Use this when the user approves or provides input for a pending workflow step.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    execution_id: {
                        type: Type.STRING,
                        description: 'ID of the workflow execution',
                    },
                    approved: {
                        type: Type.BOOLEAN,
                        description: 'Whether the user approved the action',
                    },
                    inputs: {
                        type: Type.OBJECT,
                        description: 'Additional input values from the user',
                    },
                },
                required: ['execution_id', 'approved'],
            } as Schema,
            execute: async (params) => {
                const p = params as { execution_id: string; approved: boolean; inputs?: Record<string, unknown> };
                return this.workflowEngine.respondToHITL(
                    p.execution_id,
                    { approved: p.approved, inputs: p.inputs },
                    {}
                );
            },
        });
    }

    /**
     * Create the list_workflows tool
     */
    private createListWorkflowsTool(): FunctionTool {
        return new FunctionTool({
            name: 'list_workflows',
            description: 'List available workflows and their descriptions',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        description: 'Filter by category (optional)',
                        enum: ['signals', 'folders', 'investigation'],
                    },
                },
            } as Schema,
            execute: async (params) => {
                const p = params as { category?: string };
                let workflows = allWorkflows;
                if (p.category) {
                    workflows = workflows.filter(w => w.category === p.category);
                }
                return {
                    workflows: workflows.map(w => ({
                        id: w.id,
                        name: w.name,
                        description: w.description,
                        category: w.category,
                        requiredInputs: w.requiredInputs.map(i => i.field),
                    })),
                };
            },
        });
    }

    /**
     * Convert JSON Schema to Google Schema
     */
    private convertSchema(inputSchema?: MCPToolDefinition['inputSchema']): Schema {
        if (!inputSchema?.properties) {
            return { type: Type.OBJECT, properties: {} } as Schema;
        }

        const properties: Record<string, Schema> = {};
        for (const [key, prop] of Object.entries(inputSchema.properties)) {
            properties[key] = {
                type: this.convertType(prop.type || 'string'),
                description: prop.description,
            } as Schema;
        }

        return {
            type: Type.OBJECT,
            properties,
            required: inputSchema.required || [],
        } as Schema;
    }

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
     * Build the orchestrator agent
     */
    private buildAgent(): LlmAgent {
        const gemini = new Gemini({
            model: this.modelName,
            apiKey: this.apiKey,
        });

        return new LlmAgent({
            name: 'orchestrator',
            model: gemini,
            description: 'Main orchestrator for GCMP operations',
            instruction: this.getSystemPrompt(),
            tools: this.adkTools,
        });
    }

    /**
     * Minimal system prompt - let AI reason naturally
     */
    private getSystemPrompt(): string {
        return `You are an assistant for the GCMP (Government Case Management Platform).

## What You Help With
- **Signals**: Reports of suspicious activities (human trafficking, fraud, etc.)
- **Folders**: Case files containing signals, people, organizations
- **Investigations**: Multi-step processes for case management

## How You Work
1. **Read Operations** (list, search, summarize): Execute directly using the tools
2. **Write Operations** (create, update, delete): Use workflows via \`start_workflow\`

## Workflows
When users want to create or modify data, use the appropriate workflow:
- \`signal_create\`: Create a new signal
- \`signal_to_folder\`: Create a folder from a signal
- \`full_investigation\`: Complete flow: signal → folder → Bibob application
- \`folder_create\`: Create a new folder
- \`bibob_complete\`: Complete a Bibob application

Workflows have checkpoints where you'll need user approval before proceeding.

## Important
- Gather required information conversationally before starting a workflow
- When a workflow requests approval, explain what will happen and ask the user
- For approvals, use \`respond_to_hitl\` with the execution ID
- Be concise and helpful`;
    }

    /**
     * Send streaming message
     */
    async streamMessage(
        messages: AgentMessage[],
        onStream: StreamCallback,
        context?: Record<string, unknown>
    ): Promise<void> {
        if (!this.isConnected) await this.initialize();

        const requestId = agentLogger.requestStart(
            'multi-agent',
            this.modelName,
            messages.length,
            0,
            this.adkTools.length
        );

        try {
            const agent = this.buildAgent();
            const runner = new Runner({
                appName: 'gcmp-multi-agent',
                agent,
                sessionService: this.sessionService,
                memoryService: this.memoryService,
            });

            const session = await runner.sessionService.createSession({
                appName: 'gcmp-multi-agent',
                userId: `user-${Date.now()}`,
            });

            const lastMessage = messages[messages.length - 1];
            const messageContent: Content = {
                role: 'user',
                parts: [createPartFromText(lastMessage.content)],
            };

            let currentContent = '';
            const toolCalls: ToolCall[] = [];
            const executedTools: { name: string; input: Record<string, unknown>; result: unknown }[] = [];
            let pendingHITL: WorkflowResponse['hitlRequest'] | null = null;

            for await (const event of runner.runAsync({
                userId: session.userId,
                sessionId: session.id,
                newMessage: messageContent,
            })) {
                if (event.author === 'user') continue;

                if (event.content?.parts) {
                    for (const part of event.content.parts) {
                        // Text
                        if (part.text) {
                            currentContent += part.text;
                            onStream({ type: 'thinking', data: { text: part.text } });
                        }

                        // Function call
                        if (part.functionCall?.name) {
                            const toolName = part.functionCall.name;
                            const toolInput = (part.functionCall.args || {}) as Record<string, unknown>;

                            toolCalls.push({
                                id: `tool-${Date.now()}-${toolCalls.length}`,
                                name: toolName,
                                input: toolInput,
                            });

                            // Check if this is a workflow response with HITL
                            if (toolName === 'start_workflow' || toolName === 'respond_to_hitl') {
                                // Result will be in functionResponse
                            }

                            onStream({
                                type: 'tool_call',
                                data: { tool: toolName, input: toolInput },
                            });
                        }

                        // Function response - check for HITL
                        if (part.functionResponse) {
                            const rawResponse = part.functionResponse.response as Record<string, unknown> | undefined;
                            const result = rawResponse as WorkflowResponse | undefined;

                            executedTools.push({
                                name: part.functionResponse.name || 'unknown',
                                input: {},
                                result: rawResponse,
                            });

                            // Check if workflow needs HITL
                            if (result?.hitlRequest) {
                                pendingHITL = result.hitlRequest;
                                onStream({
                                    type: 'hitl_request',
                                    data: {
                                        executionId: result.executionId,
                                        ...result.hitlRequest,
                                    },
                                });
                            }

                            onStream({
                                type: 'tool_result',
                                data: {
                                    tool: part.functionResponse.name,
                                    result: rawResponse,
                                },
                            });
                        }
                    }
                }
            }

            agentLogger.requestComplete(requestId, currentContent, 'stop');

            onStream({
                type: 'response',
                data: {
                    content: currentContent,
                    toolCalls,
                    executedTools,
                    pendingHITL,
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
     * Send non-streaming message
     */
    async sendMessage(
        messages: AgentMessage[],
        context?: Record<string, unknown>
    ): Promise<AgentResponse> {
        if (!this.isConnected) await this.initialize();

        let content = '';
        const toolCalls: ToolCall[] = [];

        await this.streamMessage(messages, (event) => {
            const data = event.data as Record<string, unknown>;
            if (event.type === 'thinking' && data?.text) {
                content += data.text as string;
            }
            if (event.type === 'tool_call' && data) {
                toolCalls.push({
                    id: `tool-${Date.now()}`,
                    name: data.tool as string,
                    input: data.input as Record<string, unknown>,
                });
            }
        }, context);

        return {
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason: 'stop',
        };
    }

    /**
     * Execute a single tool
     */
    async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
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
 * Create and initialize the multi-agent provider
 */
export async function createMultiAgentProvider(
    config: AgentConfig,
    apiKey: string,
    mcpServerCommand?: string,
    mcpServerArgs?: string[]
): Promise<GoogleMultiAgentProvider> {
    const provider = new GoogleMultiAgentProvider(
        config,
        [],
        apiKey,
        mcpServerCommand,
        mcpServerArgs
    );
    await provider.initialize();
    return provider;
}
