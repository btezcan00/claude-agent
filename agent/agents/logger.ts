/**
 * Agent Logger - Comprehensive logging for AI provider interactions
 * 
 * This logger captures detailed information about:
 * - API requests and responses
 * - Tool calls and their execution
 * - Performance metrics (latency, token usage)
 * - Errors and warnings
 * 
 * Logs can be used for:
 * - Real-time debugging (console output)
 * - Performance evaluation
 * - Model comparison analysis
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ToolCallLog {
    toolName: string;
    toolId: string;
    input: Record<string, unknown>;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    status: 'pending' | 'success' | 'error';
    result?: string;
    error?: string;
}

export interface RequestLog {
    requestId: string;
    provider: string;
    model: string;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    messageCount: number;
    systemPromptLength: number;
    toolCount: number;
    status: 'pending' | 'success' | 'error';
    toolCalls: ToolCallLog[];
    responseContent?: string;
    finishReason?: string;
    error?: string;
    tokenUsage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
}

export interface AgentLogEntry {
    timestamp: string;
    level: LogLevel;
    provider: string;
    event: string;
    requestId?: string;
    data?: Record<string, unknown>;
    message?: string;
}

class AgentLogger {
    private enabled: boolean = true;
    private logLevel: LogLevel = 'debug';
    private logs: AgentLogEntry[] = [];
    private activeRequests: Map<string, RequestLog> = new Map();
    private maxLogEntries: number = 1000;

    // ANSI color codes for terminal output
    private colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
    };

    private levelColors: Record<LogLevel, string> = {
        debug: this.colors.dim,
        info: this.colors.blue,
        warn: this.colors.yellow,
        error: this.colors.red,
    };

    private providerColors: Record<string, string> = {
        'google': this.colors.bgBlue + this.colors.white,
        'google-unified': this.colors.bgBlue + this.colors.white,
        'google-legacy': this.colors.bgBlue + this.colors.white,
        'google-mcp': this.colors.bgBlue + this.colors.white,
        'google-multiagent': this.colors.bgBlue + this.colors.white,
        'anthropic': this.colors.bgMagenta + this.colors.white,
        'mcp-server': this.colors.cyan,
    };

    /**
     * Generate unique request ID
     */
    generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    /**
     * Format timestamp for logs
     */
    private formatTime(date: Date = new Date()): string {
        return date.toISOString().replace('T', ' ').substring(0, 23);
    }

    /**
     * Format duration in human-readable form
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${(ms / 60000).toFixed(2)}m`;
    }

    /**
     * Truncate long strings for display
     */
    private truncate(str: string, maxLen: number = 100): string {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + '...';
    }

    /**
     * Format provider badge
     */
    private formatProvider(provider: string): string {
        const color = this.providerColors[provider] || this.colors.white;
        return `${color} ${provider.toUpperCase()} ${this.colors.reset}`;
    }

    /**
     * Core log function - Public for direct logging
     */
    log(level: LogLevel, provider: string, event: string, data?: Record<string, unknown>, requestId?: string): void {
        if (!this.enabled) return;

        const entry: AgentLogEntry = {
            timestamp: this.formatTime(),
            level,
            provider,
            event,
            requestId,
            data,
        };

        // Store log entry
        this.logs.push(entry);
        if (this.logs.length > this.maxLogEntries) {
            this.logs.shift();
        }

        // Console output with colors
        const levelColor = this.levelColors[level];
        const levelBadge = `${levelColor}[${level.toUpperCase()}]${this.colors.reset}`;
        const providerBadge = this.formatProvider(provider);
        const reqIdStr = requestId ? ` ${this.colors.dim}(${requestId})${this.colors.reset}` : '';

        console.log(`${this.colors.dim}${entry.timestamp}${this.colors.reset} ${levelBadge} ${providerBadge} ${this.colors.bright}${event}${this.colors.reset}${reqIdStr}`);

        if (data && Object.keys(data).length > 0) {
            const dataStr = JSON.stringify(data, null, 2);
            const lines = dataStr.split('\n');
            lines.forEach(line => {
                console.log(`  ${this.colors.dim}${line}${this.colors.reset}`);
            });
        }
    }

    // ==================== Request Lifecycle ====================

    /**
     * Log start of a new request
     */
    requestStart(provider: string, model: string, messageCount: number, systemPromptLength: number, toolCount: number): string {
        const requestId = this.generateRequestId();

        const requestLog: RequestLog = {
            requestId,
            provider,
            model,
            startTime: Date.now(),
            messageCount,
            systemPromptLength,
            toolCount,
            status: 'pending',
            toolCalls: [],
        };
        this.activeRequests.set(requestId, requestLog);

        this.log('info', provider, '🚀 REQUEST START', {
            model,
            messageCount,
            systemPromptLength: `${systemPromptLength} chars`,
            toolsAvailable: toolCount,
        }, requestId);

        return requestId;
    }

    /**
     * Log request completion
     */
    requestComplete(requestId: string, responseContent: string, finishReason: string, tokenUsage?: { inputTokens?: number; outputTokens?: number }): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        request.endTime = Date.now();
        request.durationMs = request.endTime - request.startTime;
        request.status = 'success';
        request.responseContent = responseContent;
        request.finishReason = finishReason;
        request.tokenUsage = tokenUsage ? {
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            totalTokens: (tokenUsage.inputTokens || 0) + (tokenUsage.outputTokens || 0),
        } : undefined;

        this.log('info', request.provider, '✅ REQUEST COMPLETE', {
            duration: this.formatDuration(request.durationMs),
            finishReason,
            responseLength: `${responseContent.length} chars`,
            toolCallsCount: request.toolCalls.length,
            ...(tokenUsage ? { tokens: request.tokenUsage } : {}),
        }, requestId);
    }

    /**
     * Log request error
     */
    requestError(requestId: string, error: Error | string): void {
        const request = this.activeRequests.get(requestId);
        const provider = request?.provider || 'unknown';

        if (request) {
            request.endTime = Date.now();
            request.durationMs = request.endTime - request.startTime;
            request.status = 'error';
            request.error = typeof error === 'string' ? error : error.message;
        }

        this.log('error', provider, '❌ REQUEST ERROR', {
            error: typeof error === 'string' ? error : error.message,
            duration: request ? this.formatDuration(request.durationMs!) : 'unknown',
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
        }, requestId);
    }

    // ==================== Tool Calls ====================

    /**
     * Log tool call start
     */
    toolCallStart(requestId: string, toolId: string, toolName: string, input: Record<string, unknown>): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        const toolLog: ToolCallLog = {
            toolName,
            toolId,
            input,
            startTime: Date.now(),
            status: 'pending',
        };
        request.toolCalls.push(toolLog);

        this.log('info', request.provider, `🔧 TOOL CALL: ${toolName}`, {
            toolId,
            input: this.sanitizeInput(input),
        }, requestId);
    }

    /**
     * Log tool call completion
     */
    toolCallComplete(requestId: string, toolId: string, result: string): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        const toolLog = request.toolCalls.find(t => t.toolId === toolId);
        if (toolLog) {
            toolLog.endTime = Date.now();
            toolLog.durationMs = toolLog.endTime - toolLog.startTime;
            toolLog.status = 'success';
            toolLog.result = result;
        }

        this.log('info', request.provider, `✓ TOOL RESULT: ${toolLog?.toolName || 'unknown'}`, {
            toolId,
            duration: toolLog ? this.formatDuration(toolLog.durationMs!) : 'unknown',
            result: this.truncate(result, 200),
        }, requestId);
    }

    /**
     * Log tool call error
     */
    toolCallError(requestId: string, toolId: string, error: string): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        const toolLog = request.toolCalls.find(t => t.toolId === toolId);
        if (toolLog) {
            toolLog.endTime = Date.now();
            toolLog.durationMs = toolLog.endTime - toolLog.startTime;
            toolLog.status = 'error';
            toolLog.error = error;
        }

        this.log('error', request.provider, `✗ TOOL ERROR: ${toolLog?.toolName || 'unknown'}`, {
            toolId,
            error,
            duration: toolLog ? this.formatDuration(toolLog.durationMs!) : 'unknown',
        }, requestId);
    }

    // ==================== Streaming Events ====================

    /**
     * Log streaming chunk
     */
    streamChunk(requestId: string, chunkType: string, content?: string): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        // Only log at debug level to avoid flooding
        this.log('debug', request.provider, `📡 STREAM: ${chunkType}`, {
            ...(content ? { preview: this.truncate(content, 50) } : {}),
        }, requestId);
    }

    // ==================== HITL (Human-in-the-Loop) ====================

    /**
     * Log approval request
     */
    approvalRequired(requestId: string, summary: string, toolNames: string[]): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        this.log('warn', request.provider, '⏸️ APPROVAL REQUIRED', {
            summary,
            tools: toolNames,
            toolCount: toolNames.length,
        }, requestId);
    }

    /**
     * Log approval granted
     */
    approvalGranted(requestId: string): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        this.log('info', request.provider, '▶️ APPROVAL GRANTED', {}, requestId);
    }

    /**
     * Log approval rejected
     */
    approvalRejected(requestId: string, reason?: string): void {
        const request = this.activeRequests.get(requestId);
        if (!request) return;

        this.log('info', request.provider, '⏹️ APPROVAL REJECTED', {
            ...(reason ? { reason } : {}),
        }, requestId);
    }

    // ==================== MCP Server ====================

    /**
     * Log MCP server startup
     */
    mcpServerStart(serverName: string, version: string, toolCount: number): void {
        this.log('info', 'mcp-server', '🌐 MCP SERVER STARTED', {
            name: serverName,
            version,
            toolsRegistered: toolCount,
        });
    }

    /**
     * Log MCP tool registration
     */
    mcpToolRegistered(toolName: string, category: string): void {
        this.log('debug', 'mcp-server', `📦 TOOL REGISTERED: ${toolName}`, {
            category,
        });
    }

    /**
     * Log MCP tool invocation
     */
    mcpToolInvoked(toolName: string, input: Record<string, unknown>): string {
        const requestId = this.generateRequestId();
        this.log('info', 'mcp-server', `🔧 MCP TOOL: ${toolName}`, {
            input: this.sanitizeInput(input),
        }, requestId);
        return requestId;
    }

    /**
     * Log MCP tool result
     */
    mcpToolResult(requestId: string, toolName: string, success: boolean, result?: string, error?: string): void {
        if (success) {
            this.log('info', 'mcp-server', `✓ MCP RESULT: ${toolName}`, {
                result: result ? this.truncate(result, 200) : undefined,
            }, requestId);
        } else {
            this.log('error', 'mcp-server', `✗ MCP ERROR: ${toolName}`, {
                error,
            }, requestId);
        }
    }

    // ==================== Utility ====================

    /**
     * Sanitize input for logging (remove sensitive data, truncate long values)
     */
    private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            if (typeof value === 'string') {
                sanitized[key] = this.truncate(value, 100);
            } else if (Array.isArray(value)) {
                sanitized[key] = `[Array(${value.length})]`;
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = `{Object}`;
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    /**
     * Get all logs
     */
    getLogs(): AgentLogEntry[] {
        return [...this.logs];
    }

    /**
     * Get request summary for evaluation
     */
    getRequestSummary(requestId: string): RequestLog | undefined {
        return this.activeRequests.get(requestId);
    }

    /**
     * Get all completed requests for evaluation
     */
    getAllRequests(): RequestLog[] {
        return Array.from(this.activeRequests.values());
    }

    /**
     * Export logs for analysis
     */
    exportLogs(): string {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            logs: this.logs,
            requests: Array.from(this.activeRequests.values()),
        }, null, 2);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        this.activeRequests.clear();
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Set log level
     */
    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }
}

// Export singleton instance
export const agentLogger = new AgentLogger();

// Export class for testing
export { AgentLogger };
