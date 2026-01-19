import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiRequest, formatResponse } from '../utils/api-client.js';

// Zod schemas for folder types
const CreateFolderSchema = z.object({
  name: z.string().describe('Name of the folder'),
  description: z.string().describe('Description of the folder'),
  ownerId: z.string().optional().describe('ID of the folder owner'),
  color: z.string().optional().describe('Color for the folder (hex value)'),
  icon: z.string().optional().describe('Icon name for the folder'),
  signalIds: z.array(z.string()).optional().describe('IDs of signals to add to this folder'),
});

const UpdateFolderSchema = z.object({
  name: z.string().optional().describe('Name of the folder'),
  description: z.string().optional().describe('Description of the folder'),
  ownerId: z.string().nullable().optional().describe('ID of the folder owner'),
  color: z.string().optional().describe('Color for the folder (hex value)'),
  icon: z.string().optional().describe('Icon name for the folder'),
});

const ApplicationCriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  isMet: z.boolean(),
  explanation: z.string(),
});

const ApplicationDataSchema = z.object({
  explanation: z.string().optional().describe('Explanation for the application'),
  criteria: z.array(ApplicationCriterionSchema).optional().describe('Application criteria'),
});

/**
 * Register all folder-related tools with the MCP server
 */
export function registerFolderTools(server: McpServer): void {
  // Folder List - GET /api/folders
  server.tool(
    'folder_list',
    'List all folders in the system',
    {},
    async () => {
      const response = await apiRequest({ method: 'GET', path: '/api/folders' });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Folder Get - GET /api/folders/{id}
  server.tool(
    'folder_get',
    'Get a specific folder by ID',
    {
      id: z.string().describe('The ID of the folder to retrieve'),
    },
    async ({ id }) => {
      const response = await apiRequest({
        method: 'GET',
        path: '/api/folders/{id}',
        pathParams: { id },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Folder Create - POST /api/folders
  server.tool(
    'folder_create',
    'Create a new folder',
    CreateFolderSchema.shape,
    async (params) => {
      const response = await apiRequest({
        method: 'POST',
        path: '/api/folders',
        body: params,
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Folder Update - PUT /api/folders/{id}
  server.tool(
    'folder_update',
    'Update an existing folder',
    {
      id: z.string().describe('The ID of the folder to update'),
      ...UpdateFolderSchema.shape,
    },
    async ({ id, ...updateData }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/folders/{id}',
        pathParams: { id },
        body: updateData,
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Folder Delete - DELETE /api/folders/{id}
  server.tool(
    'folder_delete',
    'Delete a folder',
    {
      id: z.string().describe('The ID of the folder to delete'),
    },
    async ({ id }) => {
      const response = await apiRequest({
        method: 'DELETE',
        path: '/api/folders/{id}',
        pathParams: { id },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Folder Submit Application - PUT /api/folders/{id}/application
  server.tool(
    'folder_submit_application',
    'Submit or update application data for a folder (Bibob application)',
    {
      id: z.string().describe('The ID of the folder'),
      applicationData: ApplicationDataSchema.optional().describe('Application form data'),
      complete: z.boolean().optional().describe('Set to true to mark application as completed'),
      assignTo: z.object({
        userId: z.string(),
        userName: z.string(),
      }).optional().describe('Assign folder ownership to a user'),
    },
    async ({ id, ...body }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/folders/{id}/application',
        pathParams: { id },
        body,
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );
}
