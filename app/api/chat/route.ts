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
          description: 'The ID of the case to edit',
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
];

export async function POST(request: NextRequest) {
  try {
    const { messages, cases }: { messages: Message[]; cases: CaseData[] } = await request.json();

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

    const systemPrompt = `You are an AI assistant for the Government Case Management Platform (GCMP). You help government employees manage crime cases related to human trafficking, illegal drugs, and illegal prostitution.

Current Cases in the System:
${caseSummary}

Your capabilities:
1. Summarize cases - provide overviews of all cases or specific case details
2. Create new cases - help users create cases by gathering required information
3. Edit existing cases - help users update case details, status, priority, etc.

When creating or editing cases, always confirm with the user before making changes. Be professional, concise, and helpful. Use the appropriate tools when the user wants to perform these actions.

Important: When referencing cases, use their case number (e.g., GCMP-2024-000001) for clarity.`;

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
