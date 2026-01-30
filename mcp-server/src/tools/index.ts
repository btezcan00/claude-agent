import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSignalTools } from './signals.js';
import { registerCaseTools } from './cases.js';

/**
 * Register all tools with the MCP server
 *
 * Total Tools: 23
 *
 * Signal Tools (7):
 *   - signal_list, signal_get, signal_create, signal_update, signal_delete
 *   - signal_add_to_case, signal_remove_from_case
 *
 * Case Management Tools (16):
 *   Read Operations (9):
 *   - summarize_cases: Get case overview
 *   - list_team_members: Team with workload
 *   - get_case_stats: Dashboard statistics
 *   - search_cases: Search by filters
 *   - get_case_activity: Activity timeline
 *   - get_case_notes: Get notes
 *   - get_overdue_cases: Find overdue items
 *   - get_unassigned_cases: Find unassigned
 *   - summarize_attachments: AI analysis of files
 *
 *   Write Operations (7 - require confirmation):
 *   - create_case: Create new case
 *   - edit_case: Update details
 *   - add_note: Add note
 *   - assign_case: Assign to member
 *   - unassign_case: Remove assignment
 *   - delete_case: Delete case
 *   - change_status: Update status
 */
export function registerAllTools(server: McpServer): void {
  // Register signal CRUD tools (7 tools)
  registerSignalTools(server);

  // Register case management tools (16 tools)
  registerCaseTools(server);
}
