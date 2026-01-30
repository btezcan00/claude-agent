import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiRequest, formatResponse } from '../utils/api-client.js';

// Types for API responses
interface Folder {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdByName: string;
  ownerId: string | null;
  ownerName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  statusDates?: Record<string, string>;
  notes: Array<{
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    isAdminOnly?: boolean;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
  fileAttachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
    textContent?: string;
  }>;
  findings: Array<{
    id: string;
    name: string;
    description: string;
    severity: string;
    isCompleted: boolean;
  }>;
  tags: string[];
  signalTypes: string[];
}

// Zod schemas
const FolderStatusSchema = z.enum([
  'application',
  'research',
  'national_office',
  'decision',
  'archive',
]);

/**
 * Register all case management tools with the MCP server
 * These tools provide a case-focused interface for managing investigations
 */
export function registerCaseTools(server: McpServer): void {
  // ==========================================
  // READ OPERATIONS (9 tools)
  // ==========================================

  // 1. summarize_cases - Get case/folder overview
  server.tool(
    'summarize_cases',
    'Get a summary overview of all cases (folders) in the system, including status breakdown and key metrics',
    {
      status: FolderStatusSchema.optional().describe('Filter by status (application, research, national_office, decision, archive)'),
      limit: z.number().optional().describe('Limit the number of cases returned'),
    },
    async ({ status, limit }) => {
      const response = await apiRequest<Folder[]>({ method: 'GET', path: '/api/cases' });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      let folders = response.data || [];

      // Filter by status if provided
      if (status) {
        folders = folders.filter((f) => f.status === status);
      }

      // Apply limit if provided
      if (limit && limit > 0) {
        folders = folders.slice(0, limit);
      }

      // Create summary
      const statusCounts = {
        application: folders.filter((f) => f.status === 'application').length,
        research: folders.filter((f) => f.status === 'research').length,
        national_office: folders.filter((f) => f.status === 'national_office').length,
        decision: folders.filter((f) => f.status === 'decision').length,
        archive: folders.filter((f) => f.status === 'archive').length,
      };

      const summary = {
        totalCases: folders.length,
        statusBreakdown: statusCounts,
        activeCases: folders.filter((f) => f.status !== 'archive').length,
        cases: folders.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          status: f.status,
          owner: f.ownerName || 'Unassigned',
          createdAt: f.createdAt,
          findingsCount: f.findings?.length || 0,
          notesCount: f.notes?.length || 0,
        })),
      };

      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
  );

  // 2. list_team_members - Team with workload
  server.tool(
    'list_team_members',
    'List all team members with their current workload (number of cases assigned)',
    {},
    async () => {
      const response = await apiRequest({ method: 'GET', path: '/api/team-members' });
      return { content: [{ type: 'text', text: formatResponse(response) }] };
    }
  );

  // 3. get_case_stats - Dashboard statistics
  server.tool(
    'get_case_stats',
    'Get comprehensive dashboard statistics for cases including counts, status distribution, and trends',
    {},
    async () => {
      const foldersResponse = await apiRequest<Folder[]>({ method: 'GET', path: '/api/cases' });
      const statsResponse = await apiRequest({ method: 'GET', path: '/api/cases/stats' });

      if (foldersResponse.error) {
        return { content: [{ type: 'text', text: formatResponse(foldersResponse) }] };
      }

      const folders = foldersResponse.data || [];
      const basicStats = statsResponse.data || {};

      // Calculate detailed stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        ...basicStats,
        byStatus: {
          application: folders.filter((f) => f.status === 'application').length,
          research: folders.filter((f) => f.status === 'research').length,
          national_office: folders.filter((f) => f.status === 'national_office').length,
          decision: folders.filter((f) => f.status === 'decision').length,
          archive: folders.filter((f) => f.status === 'archive').length,
        },
        recentActivity: {
          createdLast30Days: folders.filter((f) => new Date(f.createdAt) > thirtyDaysAgo).length,
          updatedLast30Days: folders.filter((f) => new Date(f.updatedAt) > thirtyDaysAgo).length,
        },
        findings: {
          total: folders.reduce((sum, f) => sum + (f.findings?.length || 0), 0),
          critical: folders.reduce(
            (sum, f) => sum + (f.findings?.filter((fn) => fn.severity === 'critical').length || 0),
            0
          ),
          serious: folders.reduce(
            (sum, f) => sum + (f.findings?.filter((fn) => fn.severity === 'serious').length || 0),
            0
          ),
        },
        assigned: folders.filter((f) => f.ownerId).length,
        unassigned: folders.filter((f) => !f.ownerId).length,
      };

      return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    }
  );

  // 4. search_cases - Search by filters
  server.tool(
    'search_cases',
    'Search cases by various filters including name, status, owner, and tags',
    {
      query: z.string().optional().describe('Text to search in case name and description'),
      status: FolderStatusSchema.optional().describe('Filter by case status'),
      ownerId: z.string().optional().describe('Filter by owner user ID'),
      tag: z.string().optional().describe('Filter by tag'),
      hasFindings: z.boolean().optional().describe('Filter cases that have findings'),
      hasCriticalFindings: z.boolean().optional().describe('Filter cases with critical severity findings'),
    },
    async ({ query, status, ownerId, tag, hasFindings, hasCriticalFindings }) => {
      const response = await apiRequest<Folder[]>({ method: 'GET', path: '/api/cases' });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      let folders = response.data || [];

      // Apply filters
      if (query) {
        const q = query.toLowerCase();
        folders = folders.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q)
        );
      }

      if (status) {
        folders = folders.filter((f) => f.status === status);
      }

      if (ownerId) {
        folders = folders.filter((f) => f.ownerId === ownerId);
      }

      if (tag) {
        folders = folders.filter((f) => f.tags?.includes(tag));
      }

      if (hasFindings === true) {
        folders = folders.filter((f) => f.findings && f.findings.length > 0);
      } else if (hasFindings === false) {
        folders = folders.filter((f) => !f.findings || f.findings.length === 0);
      }

      if (hasCriticalFindings) {
        folders = folders.filter((f) =>
          f.findings?.some((fn) => fn.severity === 'critical')
        );
      }

      const results = folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        owner: f.ownerName || 'Unassigned',
        ownerId: f.ownerId,
        tags: f.tags,
        findingsCount: f.findings?.length || 0,
        criticalFindings: f.findings?.filter((fn) => fn.severity === 'critical').length || 0,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ totalResults: results.length, cases: results }, null, 2),
          },
        ],
      };
    }
  );

  // 5. get_case_activity - Activity timeline
  server.tool(
    'get_case_activity',
    'Get the activity timeline for a specific case',
    {
      caseId: z.string().describe('The ID of the case to get activity for'),
      limit: z.number().optional().describe('Limit the number of activities returned'),
    },
    async ({ caseId, limit }) => {
      const response = await apiRequest<Folder>({
        method: 'GET',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      const folder = response.data;
      let activities = folder?.activities || [];

      // Sort by timestamp descending (most recent first)
      activities = activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (limit && limit > 0) {
        activities = activities.slice(0, limit);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                caseId,
                caseName: folder?.name,
                totalActivities: folder?.activities?.length || 0,
                activities,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 6. get_case_notes - Get notes
  server.tool(
    'get_case_notes',
    'Get all notes for a specific case',
    {
      caseId: z.string().describe('The ID of the case to get notes for'),
      includeAdminOnly: z.boolean().optional().describe('Include admin-only notes (default: false)'),
    },
    async ({ caseId, includeAdminOnly }) => {
      const response = await apiRequest<Folder>({
        method: 'GET',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      const folder = response.data;
      let notes = folder?.notes || [];

      // Filter admin-only notes unless explicitly requested
      if (!includeAdminOnly) {
        notes = notes.filter((n) => !n.isAdminOnly);
      }

      // Sort by date descending
      notes = notes.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                caseId,
                caseName: folder?.name,
                totalNotes: notes.length,
                notes,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 7. get_overdue_cases - Find overdue items
  server.tool(
    'get_overdue_cases',
    'Find cases that have been in the same status for an extended period (potentially stale)',
    {
      daysThreshold: z.number().optional().describe('Number of days without updates to consider overdue (default: 30)'),
      status: FolderStatusSchema.optional().describe('Filter by specific status'),
    },
    async ({ daysThreshold = 30, status }) => {
      const response = await apiRequest<Folder[]>({ method: 'GET', path: '/api/cases' });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      const folders = response.data || [];
      const now = new Date();
      const threshold = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);

      let overdueCases = folders.filter((f) => {
        // Exclude archived cases
        if (f.status === 'archive') return false;
        // Check if last update is older than threshold
        return new Date(f.updatedAt) < threshold;
      });

      if (status) {
        overdueCases = overdueCases.filter((f) => f.status === status);
      }

      const results = overdueCases.map((f) => {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - new Date(f.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          id: f.id,
          name: f.name,
          status: f.status,
          owner: f.ownerName || 'Unassigned',
          lastUpdated: f.updatedAt,
          daysSinceUpdate,
        };
      });

      // Sort by days since update descending
      results.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                threshold: `${daysThreshold} days`,
                totalOverdue: results.length,
                cases: results,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 8. get_unassigned_cases - Find unassigned
  server.tool(
    'get_unassigned_cases',
    'Find all cases that do not have an owner assigned',
    {
      status: FolderStatusSchema.optional().describe('Filter by specific status'),
    },
    async ({ status }) => {
      const response = await apiRequest<Folder[]>({ method: 'GET', path: '/api/cases' });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      let folders = (response.data || []).filter((f) => !f.ownerId);

      if (status) {
        folders = folders.filter((f) => f.status === status);
      }

      const results = folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        status: f.status,
        createdAt: f.createdAt,
        createdBy: f.createdByName,
        findingsCount: f.findings?.length || 0,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                totalUnassigned: results.length,
                cases: results,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 9. summarize_attachments - AI analysis of files
  server.tool(
    'summarize_attachments',
    'Get a summary of all file attachments for a case, including extracted text content',
    {
      caseId: z.string().describe('The ID of the case to get attachments for'),
    },
    async ({ caseId }) => {
      const response = await apiRequest<Folder>({
        method: 'GET',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      const folder = response.data;
      const attachments = folder?.fileAttachments || [];

      const summary = attachments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: `${(a.size / 1024).toFixed(2)} KB`,
        uploadedAt: a.uploadedAt,
        uploadedBy: a.uploadedBy,
        hasTextContent: !!a.textContent,
        textPreview: a.textContent
          ? a.textContent.substring(0, 500) + (a.textContent.length > 500 ? '...' : '')
          : null,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                caseId,
                caseName: folder?.name,
                totalAttachments: attachments.length,
                attachments: summary,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ==========================================
  // WRITE OPERATIONS (7 tools)
  // ==========================================

  // 1. create_case - Create new case
  server.tool(
    'create_case',
    'Create a new case (folder) for an investigation. REQUIRES CONFIRMATION.',
    {
      name: z.string().describe('Name of the case'),
      description: z.string().describe('Description of the case'),
      ownerId: z.string().optional().describe('ID of the case owner (team member)'),
      color: z.string().optional().describe('Color for the case (hex value, e.g., #FF5733)'),
      icon: z.string().optional().describe('Icon name for the case'),
      signalIds: z.array(z.string()).optional().describe('IDs of signals to link to this case'),
    },
    async (params) => {
      const response = await apiRequest({
        method: 'POST',
        path: '/api/cases',
        body: params,
      });
      return { content: [{ type: 'text', text: formatResponse(response) }] };
    }
  );

  // 2. edit_case - Update details
  server.tool(
    'edit_case',
    'Update an existing case details. REQUIRES CONFIRMATION.',
    {
      caseId: z.string().describe('The ID of the case to update'),
      name: z.string().optional().describe('New name for the case'),
      description: z.string().optional().describe('New description for the case'),
      color: z.string().optional().describe('New color for the case (hex value)'),
      icon: z.string().optional().describe('New icon name for the case'),
      tags: z.array(z.string()).optional().describe('Updated tags for the case'),
    },
    async ({ caseId, ...updateData }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
        body: updateData,
      });
      return { content: [{ type: 'text', text: formatResponse(response) }] };
    }
  );

  // 3. add_note - Add note
  server.tool(
    'add_note',
    'Add a note to a case. REQUIRES CONFIRMATION.',
    {
      caseId: z.string().describe('The ID of the case to add a note to'),
      content: z.string().describe('The content of the note'),
      isAdminOnly: z.boolean().optional().describe('Whether this note should only be visible to admins'),
    },
    async ({ caseId, content, isAdminOnly }) => {
      // First get the current folder to append the note
      const getResponse = await apiRequest<Folder>({
        method: 'GET',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });

      if (getResponse.error) {
        return { content: [{ type: 'text', text: formatResponse(getResponse) }] };
      }

      const folder = getResponse.data;
      const existingNotes = folder?.notes || [];

      const newNote = {
        id: `note-${Date.now()}`,
        content,
        authorId: 'user-001', // Current user (would come from auth in real app)
        authorName: 'Sarah Mitchell',
        createdAt: new Date().toISOString(),
        isAdminOnly: isAdminOnly || false,
      };

      const response = await apiRequest({
        method: 'PUT',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
        body: {
          notes: [...existingNotes, newNote],
        },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, note: newNote }, null, 2),
          },
        ],
      };
    }
  );

  // 4. assign_case - Assign to member
  server.tool(
    'assign_case',
    'Assign a case to a team member. REQUIRES CONFIRMATION.',
    {
      caseId: z.string().describe('The ID of the case to assign'),
      userId: z.string().describe('The ID of the user to assign the case to'),
      userName: z.string().describe('The full name of the user (for display purposes)'),
    },
    async ({ caseId, userId, userName }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
        body: {
          ownerId: userId,
          ownerName: userName,
        },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Case assigned to ${userName}`,
                caseId,
                assignedTo: { userId, userName },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 5. unassign_case - Remove assignment
  server.tool(
    'unassign_case',
    'Remove the owner assignment from a case. REQUIRES CONFIRMATION.',
    {
      caseId: z.string().describe('The ID of the case to unassign'),
    },
    async ({ caseId }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
        body: {
          ownerId: null,
          ownerName: null,
        },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'Case unassigned successfully',
                caseId,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 6. delete_case - Delete case
  server.tool(
    'delete_case',
    'Delete a case permanently. REQUIRES CONFIRMATION. This action cannot be undone.',
    {
      caseId: z.string().describe('The ID of the case to delete'),
    },
    async ({ caseId }) => {
      const response = await apiRequest({
        method: 'DELETE',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });
      return { content: [{ type: 'text', text: formatResponse(response) }] };
    }
  );

  // 7. change_status - Update status
  server.tool(
    'change_status',
    'Change the workflow status of a case. REQUIRES CONFIRMATION. Status flow: application -> research -> national_office -> decision -> archive',
    {
      caseId: z.string().describe('The ID of the case to update'),
      status: FolderStatusSchema.describe('The new status for the case'),
    },
    async ({ caseId, status }) => {
      const now = new Date().toISOString();

      // Get current folder to update statusDates
      const getResponse = await apiRequest<Folder & { statusDates?: Record<string, string> }>({
        method: 'GET',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
      });

      if (getResponse.error) {
        return { content: [{ type: 'text', text: formatResponse(getResponse) }] };
      }

      const folder = getResponse.data;
      const statusDates = folder?.statusDates || {};

      const response = await apiRequest({
        method: 'PUT',
        path: '/api/cases/{id}',
        pathParams: { id: caseId },
        body: {
          status,
          statusDates: {
            ...statusDates,
            [status]: now,
          },
        },
      });

      if (response.error) {
        return { content: [{ type: 'text', text: formatResponse(response) }] };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Case status changed to "${status}"`,
                caseId,
                previousStatus: folder?.status,
                newStatus: status,
                timestamp: now,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
