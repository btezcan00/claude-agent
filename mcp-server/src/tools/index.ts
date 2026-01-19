import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSignalTools } from './signals.js';
import { registerFolderTools } from './folders.js';

/**
 * Register all tools with the MCP server
 */
export function registerAllTools(server: McpServer): void {
  // Register signal CRUD tools (7 tools)
  registerSignalTools(server);

  // Register folder CRUD tools (6 tools)
  registerFolderTools(server);
}
