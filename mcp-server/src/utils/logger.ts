/**
 * MCP Server Logger - Comprehensive logging for MCP tool invocations
 * 
 * This logger tracks:
 * - Tool registrations
 * - Tool invocations and their inputs
 * - Tool results (success/error)
 * - Performance metrics
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface MCPToolLog {
    requestId: string;
    toolName: string;
    input: Record<string, unknown>;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    status: 'pending' | 'success' | 'error';
    result?: unknown;
    error?: string;
}

class MCPLogger {
    private enabled: boolean = true;
    private logs: MCPToolLog[] = [];
    private maxLogs: number = 500;

    // ANSI color codes
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
        bgCyan: '\x1b[46m',
        white: '\x1b[37m',
    };

    /**
     * Generate unique request ID
     */
    generateRequestId(): string {
        return `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    /**
     * Format timestamp
     */
    private formatTime(): string {
        return new Date().toISOString().replace('T', ' ').substring(0, 23);
    }

    /**
     * Format duration
     */
    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    /**
     * Truncate long strings
     */
    private truncate(str: string, maxLen: number = 100): string {
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen) + '...';
    }

    /**
     * Sanitize input for logging
     */
    private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            if (typeof value === 'string') {
                sanitized[key] = this.truncate(value, 80);
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
     * Log to stderr (doesn't interfere with MCP stdio protocol)
     */
    private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
        if (!this.enabled) return;

        const levelColors: Record<LogLevel, string> = {
            debug: this.colors.dim,
            info: this.colors.cyan,
            warn: this.colors.yellow,
            error: this.colors.red,
        };

        const levelColor = levelColors[level];
        const badge = `${this.colors.bgCyan}${this.colors.white} MCP ${this.colors.reset}`;
        const levelBadge = `${levelColor}[${level.toUpperCase()}]${this.colors.reset}`;

        console.error(`${this.colors.dim}${this.formatTime()}${this.colors.reset} ${badge} ${levelBadge} ${this.colors.bright}${message}${this.colors.reset}`);

        if (data && Object.keys(data).length > 0) {
            const dataStr = JSON.stringify(data, null, 2);
            const lines = dataStr.split('\n');
            lines.forEach(line => {
                console.error(`  ${this.colors.dim}${line}${this.colors.reset}`);
            });
        }
    }

    // ==================== Server Lifecycle ====================

    /**
     * Log server startup
     */
    serverStart(name: string, version: string): void {
        this.log('info', `🌐 SERVER STARTED: ${name} v${version}`);
    }

    /**
     * Log tool registration
     */
    toolRegistered(toolName: string, category: string): void {
        this.log('debug', `📦 TOOL REGISTERED: ${toolName}`, { category });
    }

    /**
     * Log all tools registered summary
     */
    allToolsRegistered(count: number, categories: Record<string, number>): void {
        this.log('info', `✅ ALL TOOLS REGISTERED: ${count} total`, categories);
    }

    // ==================== Tool Invocations ====================

    /**
     * Log tool invocation start
     */
    toolInvoked(toolName: string, input: Record<string, unknown>): string {
        const requestId = this.generateRequestId();

        const toolLog: MCPToolLog = {
            requestId,
            toolName,
            input,
            startTime: Date.now(),
            status: 'pending',
        };

        this.logs.push(toolLog);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.log('info', `🔧 TOOL INVOKED: ${toolName}`, {
            requestId,
            input: this.sanitizeInput(input),
        });

        return requestId;
    }

    /**
     * Log tool success
     */
    toolSuccess(requestId: string, result?: unknown): void {
        const toolLog = this.logs.find(l => l.requestId === requestId);
        if (toolLog) {
            toolLog.endTime = Date.now();
            toolLog.durationMs = toolLog.endTime - toolLog.startTime;
            toolLog.status = 'success';
            toolLog.result = result;

            this.log('info', `✓ TOOL SUCCESS: ${toolLog.toolName}`, {
                requestId,
                duration: this.formatDuration(toolLog.durationMs),
                resultPreview: result ? this.truncate(JSON.stringify(result), 150) : undefined,
            });
        }
    }

    /**
     * Log tool error
     */
    toolError(requestId: string, error: string): void {
        const toolLog = this.logs.find(l => l.requestId === requestId);
        if (toolLog) {
            toolLog.endTime = Date.now();
            toolLog.durationMs = toolLog.endTime - toolLog.startTime;
            toolLog.status = 'error';
            toolLog.error = error;

            this.log('error', `✗ TOOL ERROR: ${toolLog.toolName}`, {
                requestId,
                duration: this.formatDuration(toolLog.durationMs),
                error,
            });
        } else {
            this.log('error', `✗ TOOL ERROR (unknown request)`, {
                requestId,
                error,
            });
        }
    }

    // ==================== API Calls ====================

    /**
     * Log API request
     */
    apiRequest(method: string, url: string, requestId?: string): void {
        this.log('debug', `📤 API REQUEST: ${method} ${url}`, { requestId });
    }

    /**
     * Log API response
     */
    apiResponse(method: string, url: string, status: number, requestId?: string): void {
        const level = status >= 400 ? 'error' : 'debug';
        this.log(level, `📥 API RESPONSE: ${method} ${url} → ${status}`, { requestId });
    }

    // ==================== Utility ====================

    /**
     * Get all logs for analysis
     */
    getLogs(): MCPToolLog[] {
        return [...this.logs];
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): Record<string, { count: number; avgDuration: number; errorCount: number }> {
        const summary: Record<string, { count: number; totalDuration: number; errorCount: number }> = {};

        for (const log of this.logs) {
            if (!summary[log.toolName]) {
                summary[log.toolName] = { count: 0, totalDuration: 0, errorCount: 0 };
            }
            summary[log.toolName].count++;
            if (log.durationMs) {
                summary[log.toolName].totalDuration += log.durationMs;
            }
            if (log.status === 'error') {
                summary[log.toolName].errorCount++;
            }
        }

        const result: Record<string, { count: number; avgDuration: number; errorCount: number }> = {};
        for (const [tool, data] of Object.entries(summary)) {
            result[tool] = {
                count: data.count,
                avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
                errorCount: data.errorCount,
            };
        }
        return result;
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            logs: this.logs,
            summary: this.getPerformanceSummary(),
        }, null, 2);
    }

    /**
     * Clear logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}

// Export singleton instance
export const mcpLogger = new MCPLogger();
