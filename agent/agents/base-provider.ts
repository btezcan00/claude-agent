/**
 * Base Agent Provider Interface
 * 
 * Defines the contract that all agent providers must implement.
 * This allows for easy swapping between Anthropic, Google Gemini, or other LLM providers.
 */

export interface AgentMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AgentTool {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ToolResult {
    tool_call_id: string;
    name: string; // The name of the tool called
    content: string;
    is_error?: boolean;
}

export interface StreamEvent {
    type:
    | 'phase'
    | 'thinking'
    | 'tool_call'
    | 'tool_executed'
    | 'tool_result'
    | 'response'
    | 'approval_required'
    | 'error'
    // Multi-agent events
    | 'clarification_needed'
    | 'plan_proposal'
    // Workflow HITL events
    | 'hitl_request';
    data: unknown;
}

export type StreamCallback = (event: StreamEvent) => void;

export interface AgentConfig {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
}

export interface ApprovalRequest {
    id: string;
    type: 'plan' | 'tool' | 'action';
    summary: string;
    details: unknown;
    timestamp: Date;
}

export interface AgentResponse {
    content: string;
    toolCalls?: ToolCall[];
    requiresApproval?: boolean;
    approvalRequest?: ApprovalRequest;
    finishReason: 'stop' | 'tool_use' | 'max_tokens' | 'approval_required';
}

/**
 * Abstract base class for agent providers
 */
export abstract class AgentProvider {
    protected config: AgentConfig;
    protected tools: AgentTool[];

    constructor(config: AgentConfig, tools: AgentTool[]) {
        this.config = config;
        this.tools = tools;
    }

    /**
     * Send a message and get a response (non-streaming)
     */
    abstract sendMessage(
        messages: AgentMessage[],
        context?: Record<string, unknown>
    ): Promise<AgentResponse>;

    /**
     * Send a message and stream the response
     */
    abstract streamMessage(
        messages: AgentMessage[],
        onStream: StreamCallback,
        context?: Record<string, unknown>
    ): Promise<void>;

    /**
     * Execute a tool call
     */
    abstract executeTool(toolCall: ToolCall): Promise<ToolResult>;

    /**
     * Check if the provider requires approval for a specific action
     */
    abstract requiresApproval(action: string): boolean;

    /**
     * Get the provider name
     */
    abstract getProviderName(): string;
}

/**
 * Human-in-the-Loop Controller
 * 
 * Manages approval workflows for sensitive operations
 */
export interface HumanApprovalConfig {
    requireApprovalFor: {
        plans?: boolean;
        writeOperations?: boolean;
        deleteOperations?: boolean;
        bulkOperations?: boolean;
        specificTools?: string[];
    };
    autoApproveRead?: boolean;
    approvalTimeout?: number; // milliseconds
}

export class HumanInTheLoopController {
    private config: HumanApprovalConfig;
    private pendingApprovals: Map<string, ApprovalRequest>;
    private approvalCallbacks: Map<string, (approved: boolean) => void>;

    constructor(config: HumanApprovalConfig) {
        this.config = config;
        this.pendingApprovals = new Map();
        this.approvalCallbacks = new Map();
    }

    /**
     * Check if an action requires approval
     */
    requiresApproval(action: {
        type: 'plan' | 'tool' | 'action';
        name: string;
        isWrite?: boolean;
        isDelete?: boolean;
        isBulk?: boolean;
    }): boolean {
        // Auto-approve read operations if configured
        if (this.config.autoApproveRead && !action.isWrite && !action.isDelete) {
            return false;
        }

        // Check specific tool approval requirements
        if (this.config.requireApprovalFor.specificTools?.includes(action.name)) {
            return true;
        }

        // Check operation type approval requirements
        if (action.type === 'plan' && this.config.requireApprovalFor.plans) {
            return true;
        }

        if (action.isWrite && this.config.requireApprovalFor.writeOperations) {
            return true;
        }

        if (action.isDelete && this.config.requireApprovalFor.deleteOperations) {
            return true;
        }

        if (action.isBulk && this.config.requireApprovalFor.bulkOperations) {
            return true;
        }

        return false;
    }

    /**
     * Request approval for an action
     */
    async requestApproval(request: ApprovalRequest): Promise<boolean> {
        this.pendingApprovals.set(request.id, request);

        return new Promise((resolve) => {
            this.approvalCallbacks.set(request.id, resolve);

            // Set timeout if configured
            if (this.config.approvalTimeout) {
                setTimeout(() => {
                    if (this.approvalCallbacks.has(request.id)) {
                        this.handleApproval(request.id, false);
                    }
                }, this.config.approvalTimeout);
            }
        });
    }

    /**
     * Handle approval response from user
     */
    handleApproval(requestId: string, approved: boolean): void {
        const callback = this.approvalCallbacks.get(requestId);
        if (callback) {
            callback(approved);
            this.approvalCallbacks.delete(requestId);
            this.pendingApprovals.delete(requestId);
        }
    }

    /**
     * Get pending approval request
     */
    getPendingApproval(requestId: string): ApprovalRequest | undefined {
        return this.pendingApprovals.get(requestId);
    }

    /**
     * Get all pending approvals
     */
    getAllPendingApprovals(): ApprovalRequest[] {
        return Array.from(this.pendingApprovals.values());
    }
}
