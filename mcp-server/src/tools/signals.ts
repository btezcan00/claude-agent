import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiRequest, formatResponse } from '../utils/api-client.js';

// Zod schemas for signal types
const SignalTypeSchema = z.enum([
  'malafide-constructie',
  'mensenhandel',
  'drugshandel',
  'bibob-onderzoek',
  'witwassen',
]);

const SignalSourceSchema = z.enum([
  'politie',
  'bibob-aanvraag',
  'anonieme-melding',
  'gemeentelijke-afdeling',
  'overig',
]);

const ContactPersonSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  wantsFeedback: z.boolean(),
}).optional();

const CreateSignalSchema = z.object({
  description: z.string().describe('Description of the signal'),
  types: z.array(SignalTypeSchema).describe('Types of signal (e.g., bogus-scheme, human-trafficking)'),
  placeOfObservation: z.string().describe('Location where the signal was observed'),
  locationDescription: z.string().optional().describe('Additional location details'),
  timeOfObservation: z.string().describe('ISO timestamp when the signal was observed'),
  receivedBy: SignalSourceSchema.describe('Source of the signal'),
  contactPerson: ContactPersonSchema.describe('Contact person details'),
  caseIds: z.array(z.string()).optional().describe('IDs of cases to link this signal to'),
});

const UpdateSignalSchema = z.object({
  description: z.string().optional().describe('Description of the signal'),
  types: z.array(SignalTypeSchema).optional().describe('Types of signal'),
  placeOfObservation: z.string().optional().describe('Location where the signal was observed'),
  locationDescription: z.string().optional().describe('Additional location details'),
  timeOfObservation: z.string().optional().describe('ISO timestamp when the signal was observed'),
  receivedBy: SignalSourceSchema.optional().describe('Source of the signal'),
  contactPerson: ContactPersonSchema.describe('Contact person details'),
});

/**
 * Register all signal-related tools with the MCP server
 */
export function registerSignalTools(server: McpServer): void {
  // Signal List - GET /api/signals
  server.tool(
    'signal_list',
    'List all signals in the system',
    {},
    async () => {
      const response = await apiRequest({ method: 'GET', path: '/api/signals' });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Get - GET /api/signals/{id}
  server.tool(
    'signal_get',
    'Get a specific signal by ID',
    {
      id: z.string().describe('The ID of the signal to retrieve'),
    },
    async ({ id }) => {
      const response = await apiRequest({
        method: 'GET',
        path: '/api/signals/{id}',
        pathParams: { id },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Create - POST /api/signals
  server.tool(
    'signal_create',
    'Create a new signal',
    CreateSignalSchema.shape,
    async (params) => {
      const response = await apiRequest({
        method: 'POST',
        path: '/api/signals',
        body: params,
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Update - PUT /api/signals/{id}
  server.tool(
    'signal_update',
    'Update an existing signal',
    {
      id: z.string().describe('The ID of the signal to update'),
      ...UpdateSignalSchema.shape,
    },
    async ({ id, ...updateData }) => {
      const response = await apiRequest({
        method: 'PUT',
        path: '/api/signals/{id}',
        pathParams: { id },
        body: updateData,
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Delete - DELETE /api/signals/{id}
  server.tool(
    'signal_delete',
    'Delete a signal',
    {
      id: z.string().describe('The ID of the signal to delete'),
    },
    async ({ id }) => {
      const response = await apiRequest({
        method: 'DELETE',
        path: '/api/signals/{id}',
        pathParams: { id },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Add to Case - POST /api/signals/{id}/case-relations
  server.tool(
    'signal_add_to_case',
    'Link a signal to a case',
    {
      signalId: z.string().describe('The ID of the signal'),
      caseId: z.string().describe('The ID of the case to link to'),
      relation: z.string().optional().describe('Optional relation description'),
    },
    async ({ signalId, caseId, relation }) => {
      const response = await apiRequest({
        method: 'POST',
        path: '/api/signals/{id}/case-relations',
        pathParams: { id: signalId },
        body: { caseId, relation },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );

  // Signal Remove from Case - DELETE /api/dossiers/{caseId}/signals/{signalId}
  server.tool(
    'signal_remove_from_case',
    'Unlink a signal from a case',
    {
      caseId: z.string().describe('The ID of the case'),
      signalId: z.string().describe('The ID of the signal to unlink'),
    },
    async ({ caseId, signalId }) => {
      const response = await apiRequest({
        method: 'DELETE',
        path: '/api/dossiers/{caseId}/signals/{signalId}',
        pathParams: { caseId, signalId },
      });
      return {
        content: [{ type: 'text', text: formatResponse(response) }],
      };
    }
  );
}
