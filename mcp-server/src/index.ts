#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

/**
 * MCP Server for Signal and Folder API
 *
 * This server exposes the backend API endpoints as MCP tools,
 * allowing Claude Desktop and other MCP clients to interact with
 * the system through natural language.
 *
 * Tools:
 * - Signal CRUD: signal_list, signal_get, signal_create, signal_update, signal_delete
 * - Signal Relations: signal_add_to_folder, signal_remove_from_folder
 * - Folder CRUD: folder_list, folder_get, folder_create, folder_update, folder_delete
 * - Folder Application: folder_submit_application
 */

async function main(): Promise<void> {
  // Create MCP server instance
  const server = new McpServer({
    name: 'signal-folder-api',
    version: '1.0.0',
  });

  // Register all tools
  registerAllTools(server);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log server start (to stderr to not interfere with stdio protocol)
  console.error('MCP Server started - Signal & Folder API');
  console.error(`API Base URL: ${process.env.API_BASE_URL || 'http://localhost:3000'}`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
