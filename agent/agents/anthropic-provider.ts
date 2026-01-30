import Anthropic from '@anthropic-ai/sdk';
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
    ApprovalRequest,
} from './base-provider';
import { agentLogger } from './logger';

/**
 * Anthropic Claude Provider
 * 
 * Implementation of the agent provider for Anthropic's Claude models
 */
export class AnthropicProvider extends AgentProvider {
    private client: Anthropic;
    private writeTools: Set<string>;
    private modelName: string;

    constructor(config: AgentConfig, tools: AgentTool[], apiKey: string) {
        super(config, tools);
        this.client = new Anthropic({ apiKey });
        this.modelName = config.model || 'claude-3-5-sonnet-20241022';

        // Define tools that require approval (write operations)
        this.writeTools = new Set([
            'create_signal',
            'edit_signal',
            'delete_signal',
            'create_folder',
            'edit_folder',
            'delete_folder',
            'complete_bibob_application',
            'assign_folder_owner',
            'add_folder_practitioner',
            'share_folder',
            'add_note',
        ]);

        agentLogger.log('info', 'anthropic', '🔌 PROVIDER INITIALIZED', {
            model: this.modelName,
            toolsLoaded: tools.length,
            writeToolsCount: this.writeTools.size,
        });
    }

    getProviderName(): string {
        return 'anthropic';
    }

    requiresApproval(toolName: string): boolean {
        return this.writeTools.has(toolName);
    }

    /**
     * Convert our tools format to Anthropic's format
     */
    private convertToolsToAnthropic(): Anthropic.Tool[] {
        return this.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema,
        }));
    }

    /**
     * Convert messages to Anthropic format
     */
    private convertMessages(messages: AgentMessage[]): Anthropic.MessageParam[] {
        return messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
        }));
    }

    /**
     * Send a non-streaming message
     */
    async sendMessage(
        messages: AgentMessage[],
        context?: Record<string, unknown>
    ): Promise<AgentResponse> {
        const requestId = agentLogger.requestStart(
            'anthropic',
            this.modelName,
            messages.length,
            this.config.systemPrompt?.length || 0,
            this.tools.length
        );

        try {
            const anthropicMessages = this.convertMessages(messages);
            const anthropicTools = this.convertToolsToAnthropic();

            agentLogger.log('debug', 'anthropic', '📤 SENDING MESSAGE', {
                messageLength: messages[messages.length - 1]?.content.length || 0,
            }, requestId);

            const response = await this.client.messages.create({
                model: this.modelName,
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
                system: this.config.systemPrompt || '',
                messages: anthropicMessages,
                tools: anthropicTools,
            });

            let content = '';
            const toolCalls: ToolCall[] = [];

            for (const block of response.content) {
                if (block.type === 'text') {
                    content += block.text;
                } else if (block.type === 'tool_use') {
                    const toolCall: ToolCall = {
                        id: block.id,
                        name: block.name,
                        input: block.input as Record<string, unknown>,
                    };
                    toolCalls.push(toolCall);
                    agentLogger.toolCallStart(requestId, toolCall.id, toolCall.name, toolCall.input);
                }
            }

            // Check if any tool calls require approval
            const requiresApproval = toolCalls.some((tc) => this.requiresApproval(tc.name));

            if (requiresApproval) {
                agentLogger.approvalRequired(requestId, `Execute ${toolCalls.length} action(s)`, toolCalls.map(tc => tc.name));
            }

            let approvalRequest: ApprovalRequest | undefined;
            if (requiresApproval) {
                approvalRequest = {
                    id: `approval-${Date.now()}`,
                    type: 'plan',
                    summary: `Execute ${toolCalls.length} action(s)`,
                    details: toolCalls,
                    timestamp: new Date(),
                };
            }

            const tokenUsage = response.usage ? {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            } : undefined;

            agentLogger.requestComplete(requestId, content, response.stop_reason || 'stop', tokenUsage);

            return {
                content,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                requiresApproval,
                approvalRequest,
                finishReason: response.stop_reason === 'tool_use'
                    ? (requiresApproval ? 'approval_required' : 'tool_use')
                    : response.stop_reason as 'stop' | 'max_tokens',
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
        const requestId = agentLogger.requestStart(
            'anthropic',
            this.modelName,
            messages.length,
            this.config.systemPrompt?.length || 0,
            this.tools.length
        );

        try {
            const anthropicMessages = this.convertMessages(messages);
            const anthropicTools = this.convertToolsToAnthropic();

            let currentToolCalls: ToolCall[] = [];
            let currentContent = '';
            const toolAccumulators: Record<number, { id: string; name: string; partialJson: string }> = {};
            let chunkCount = 0;

            agentLogger.log('debug', 'anthropic', '📡 STARTING STREAM', {
                messageLength: messages[messages.length - 1]?.content.length || 0,
            }, requestId);

            const stream = await this.client.messages.create({
                model: this.modelName,
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
                system: this.config.systemPrompt || '',
                messages: anthropicMessages,
                tools: anthropicTools,
                stream: true,
            });

            for await (const event of stream) {
                chunkCount++;

                if (event.type === 'content_block_start') {
                    if (event.content_block.type === 'text') {
                        agentLogger.streamChunk(requestId, 'text_start');
                        onStream({ type: 'thinking', data: { text: '' } });
                    } else if (event.content_block.type === 'tool_use') {
                        const toolUse = event.content_block;
                        toolAccumulators[event.index] = {
                            id: toolUse.id,
                            name: toolUse.name,
                            partialJson: '',
                        };
                        agentLogger.streamChunk(requestId, 'tool_start', toolUse.name);
                    }
                } else if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                        currentContent += event.delta.text;
                        onStream({
                            type: 'thinking',
                            data: { text: event.delta.text },
                        });
                    } else if (event.delta.type === 'input_json_delta') {
                        if (toolAccumulators[event.index]) {
                            toolAccumulators[event.index].partialJson += event.delta.partial_json;
                        }
                    }
                } else if (event.type === 'content_block_stop') {
                    const acc = toolAccumulators[event.index];
                    if (acc) {
                        try {
                            const input = JSON.parse(acc.partialJson || '{}');
                            const toolCall: ToolCall = {
                                id: acc.id,
                                name: acc.name,
                                input,
                            };
                            currentToolCalls.push(toolCall);
                            agentLogger.toolCallStart(requestId, toolCall.id, toolCall.name, toolCall.input);

                            onStream({
                                type: 'tool_call',
                                data: {
                                    tool: acc.name,
                                    input,
                                },
                            });
                        } catch (e) {
                            agentLogger.log('error', 'anthropic', '❌ TOOL JSON PARSE ERROR', {
                                partialJson: acc.partialJson,
                                error: String(e),
                            }, requestId);
                        }
                    }
                } else if (event.type === 'message_delta') {
                    if (event.delta.stop_reason === 'tool_use') {
                        // Check if approval is required
                        const requiresApproval = currentToolCalls.some((tc) =>
                            this.requiresApproval(tc.name)
                        );

                        if (requiresApproval) {
                            agentLogger.approvalRequired(requestId, `Execute ${currentToolCalls.length} action(s)`, currentToolCalls.map(tc => tc.name));
                            onStream({
                                type: 'approval_required',
                                data: {
                                    id: `approval-${Date.now()}`,
                                    type: 'plan',
                                    summary: `Execute ${currentToolCalls.length} action(s)`,
                                    details: currentToolCalls,
                                },
                            });
                        }
                    }
                } else if (event.type === 'message_stop') {
                    agentLogger.log('debug', 'anthropic', '📡 STREAM COMPLETE', {
                        chunks: chunkCount,
                        contentLength: currentContent.length,
                        toolCalls: currentToolCalls.length,
                    }, requestId);

                    agentLogger.requestComplete(requestId, currentContent, currentToolCalls.length > 0 ? 'tool_use' : 'stop');

                    onStream({
                        type: 'response',
                        data: {
                            content: currentContent,
                            toolCalls: currentToolCalls,
                        },
                    });
                }
            }
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
     * Execute a tool call (placeholder - actual execution happens in API route)
     */
    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        // This is a placeholder - actual execution happens in the API route
        return {
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: JSON.stringify({ success: true, message: 'Tool executed' }),
            is_error: false,
        };
    }
}
