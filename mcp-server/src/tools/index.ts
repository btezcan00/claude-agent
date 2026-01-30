import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSignalTools } from './signals.js';
import { registerFolderTools } from './folders.js';
import { registerCaseTools } from './cases.js';
import { mcpLogger } from '../utils/logger.js';

/**
 * Register all tools with the MCP server
 *
 * Total Tools: 29
 *
 * Signal Tools (7):
 *   - signal_list, signal_get, signal_create, signal_update, signal_delete
 *   - signal_add_to_folder, signal_remove_from_folder
 *
 * Folder Tools (6):
 *   - folder_list, folder_get, folder_create, folder_update, folder_delete
 *   - folder_submit_application
 *
 * Case Management Tools (16):
 *   Read Operations (9):
 *   - summarize_cases: Get case/folder overview
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
export function registerAllTools(server: McpServer): number {
  // Register signal CRUD tools (7 tools)
  registerSignalTools(server);
  mcpLogger.toolRegistered('signal_*', 'signals');

  // Register folder CRUD tools (6 tools)
  registerFolderTools(server);
  mcpLogger.toolRegistered('folder_*', 'folders');

  // Register case management tools (16 tools)
  registerCaseTools(server);
  mcpLogger.toolRegistered('case_*', 'cases');

  return 29; // Total tools registered
}
