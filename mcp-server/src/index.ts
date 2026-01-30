#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './tools/index.js';

/**
 * MCP Server for Government Case Management Platform
 *
 * This server exposes the backend API endpoints as MCP tools,
 * allowing Claude Desktop and other MCP clients to interact with
 * the system through natural language.
 *
 * Total Tools: 23
 *
 * Signal Tools (7):
 * - signal_list, signal_get, signal_create, signal_update, signal_delete
 * - signal_add_to_case, signal_remove_from_case
 *
 * Case Management Tools (16):
 * Read Operations (9):
 * - summarize_cases: Get case overview
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
    name: 'signal-case-api',
    version: '1.0.0',
  });

  // Register all tools
  registerAllTools(server);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log server start (to stderr to not interfere with stdio protocol)
  console.error('MCP Server started - Signal & Case API');
  console.error(`API Base URL: ${process.env.API_BASE_URL || 'http://localhost:3000'}`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
