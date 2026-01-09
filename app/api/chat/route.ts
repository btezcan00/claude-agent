import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CaseData {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  activeCasesCount: number;
  maxCaseCapacity: number;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'summarize_cases',
    description: 'Summarize all cases or a specific case by ID. Use this when the user wants an overview of cases.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'Optional specific case ID to summarize. If not provided, summarizes all cases.',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_case',
    description: 'Create a new case with the specified details. Returns the case data that should be created.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the case',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the case',
        },
        type: {
          type: 'string',
          enum: ['human-trafficking', 'illegal-drugs', 'illegal-prostitution'],
          description: 'The type of crime',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Priority level of the case',
        },
        location: {
          type: 'string',
          description: 'Location where the crime occurred',
        },
      },
      required: ['title', 'description', 'type', 'priority'],
    },
  },
  {
    name: 'edit_case',
    description: 'Edit an existing case. Returns the updates that should be applied.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case to edit',
        },
        title: {
          type: 'string',
          description: 'New title for the case',
        },
        description: {
          type: 'string',
          description: 'New description for the case',
        },
        type: {
          type: 'string',
          enum: ['human-trafficking', 'illegal-drugs', 'illegal-prostitution'],
          description: 'New type for the case',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'New priority level',
        },
        status: {
          type: 'string',
          enum: ['open', 'in-progress', 'closed'],
          description: 'New status for the case',
        },
        location: {
          type: 'string',
          description: 'New location for the case',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a note to an existing case. Use this when the user wants to add comments, observations, or updates to a case.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case to add a note to',
        },
        content: {
          type: 'string',
          description: 'The content of the note to add',
        },
        is_private: {
          type: 'boolean',
          description: 'Whether the note should be private (default: false)',
        },
      },
      required: ['case_id', 'content'],
    },
  },
  {
    name: 'assign_case',
    description: 'Assign a case to a team member. Use this when the user wants to assign a case to someone.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case to assign',
        },
        assignee_name: {
          type: 'string',
          description: 'The full name of the team member to assign the case to (e.g., "James Rodriguez")',
        },
      },
      required: ['case_id', 'assignee_name'],
    },
  },
  {
    name: 'unassign_case',
    description: 'Remove the current assignee from a case. Use this when the user wants to unassign a case.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case to unassign',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'delete_case',
    description: 'Delete a case from the system. Use this when the user explicitly wants to delete/remove a case. Always confirm before deleting.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case to delete',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'list_team_members',
    description: 'List all available team members who can be assigned to cases. Use this when the user asks who is available or wants to see team member workload.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_case_stats',
    description: 'Get dashboard statistics about all cases. Returns total count, counts by status (open, in-progress, closed), counts by priority (critical, high), and unassigned count.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_cases',
    description: 'Search and filter cases by various criteria. Use this when the user wants to find specific cases.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search keyword to match against case title, description, or case number',
        },
        status: {
          type: 'string',
          enum: ['open', 'in-progress', 'closed'],
          description: 'Filter by case status',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Filter by priority level',
        },
        type: {
          type: 'string',
          enum: ['human-trafficking', 'illegal-drugs', 'illegal-prostitution'],
          description: 'Filter by case type',
        },
        assignee_name: {
          type: 'string',
          description: 'Filter by assignee name',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_case_activity',
    description: 'Get the activity history/timeline for a specific case. Shows all actions taken on the case.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'change_status',
    description: 'Change the status of a case. Use this for quick status updates (open, in-progress, closed).',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case',
        },
        new_status: {
          type: 'string',
          enum: ['open', 'in-progress', 'closed'],
          description: 'The new status for the case',
        },
      },
      required: ['case_id', 'new_status'],
    },
  },
  {
    name: 'get_case_notes',
    description: 'Get all notes for a specific case.',
    input_schema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: 'The ID or case number of the case',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'get_overdue_cases',
    description: 'Get all cases that are past their due date and not yet closed.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_unassigned_cases',
    description: 'Get all cases that do not have an assignee.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { messages, cases, teamMembers }: { messages: Message[]; cases: CaseData[]; teamMembers: TeamMember[] } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const caseSummary = cases
      .map(
        (c) =>
          `- ${c.caseNumber}: "${c.title}" (${c.type}, ${c.status}, ${c.priority} priority)${c.assigneeName ? ` - Assigned to ${c.assigneeName}` : ' - Unassigned'}`
      )
      .join('\n');

    const teamSummary = teamMembers
      .map(
        (m) =>
          `- ${m.firstName} ${m.lastName} (${m.id}): ${m.title} - ${m.activeCasesCount}/${m.maxCaseCapacity} cases`
      )
      .join('\n');

    const systemPrompt = `You are an AI assistant for the Government Case Management Platform (GCMP). You help government employees manage crime cases related to human trafficking, illegal drugs, and illegal prostitution.

Current Cases in the System:
${caseSummary}

Team Members Available for Assignment:
${teamSummary}

Your capabilities:

**Case Management:**
1. Summarize cases - provide overviews of all cases or specific case details
2. Create new cases - help users create cases by gathering required information
3. Edit existing cases - help users update case details, status, priority, etc.
4. Add notes to cases - add comments, observations, or updates to existing cases
5. Delete cases - remove a case from the system (always confirm first)

**Assignment:**
6. Assign cases - assign a case to a team member
7. Unassign cases - remove the current assignee from a case
8. List team members - show available team members and their current workload

**Analytics & Search:**
9. Get case stats - show dashboard statistics (total, open, in-progress, closed, critical, unassigned)
10. Search cases - find cases by keyword, status, priority, type, or assignee
11. Get overdue cases - find cases past their due date
12. Get unassigned cases - find cases without an assignee

**Case Details:**
13. Get case activity - view the activity history/timeline for a case
14. Get case notes - view all notes for a specific case
15. Change status - quickly change a case's status (open, in-progress, closed)

When creating, editing, assigning, or deleting cases, always confirm with the user before making changes. Be professional, concise, and helpful. Use the appropriate tools when the user wants to perform these actions.

Important: When referencing cases, use their case number (e.g., GCMP-2024-000001) for clarity. When assigning cases, use the team member's full name.`;

    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    });

    // Process the response
    let textContent = '';
    let toolUse: { name: string; input: Record<string, unknown> } | null = null;

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolUse = {
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }
    }

    return NextResponse.json({
      content: textContent,
      toolUse,
      stopReason: response.stop_reason,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
