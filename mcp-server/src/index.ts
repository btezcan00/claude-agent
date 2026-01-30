#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';
import { mcpLogger } from './utils/logger.js';

/**
 * MCP Server for Government Case Management Platform
 *
 * This server exposes the backend API endpoints as MCP tools,
 * allowing Claude Desktop and other MCP clients to interact with
 * the system through natural language.
 *
 * Total Tools: 29
 *
 * Signal Tools (7):
 * - signal_list, signal_get, signal_create, signal_update, signal_delete
 * - signal_add_to_folder, signal_remove_from_folder
 *
 * Folder Tools (6):
 * - folder_list, folder_get, folder_create, folder_update, folder_delete
 * - folder_submit_application
 *
 * Case Management Tools (16):
 * Read Operations (9):
 * - summarize_cases: Get case/folder overview
 * - list_team_members: Team with workload
 * - get_case_stats: Dashboard statistics
 * - search_cases: Search by filters
 * - get_case_activity: Activity timeline
 * - get_case_notes: Get notes
 * - get_overdue_cases: Find overdue items
 * - get_unassigned_cases: Find unassigned
 * - summarize_attachments: AI analysis of files
 *
 * Write Operations (7 - require confirmation):
 * - create_case: Create new case
 * - edit_case: Update details
 * - add_note: Add note
 * - assign_case: Assign to member
 * - unassign_case: Remove assignment
 * - delete_case: Delete case
 * - change_status: Update status
 */

async function main(): Promise<void> {
  // Create MCP server instance
  const server = new McpServer({
    name: 'signal-folder-api',
    version: '1.0.0',
  });

  // Log server start
  mcpLogger.serverStart('signal-folder-api', '1.0.0');

  // Register all tools
  const toolCount = registerAllTools(server);

  // Log tools registered
  mcpLogger.allToolsRegistered(toolCount, {
    signals: 7,
    folders: 6,
    cases: 16,
  });

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
