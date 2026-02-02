/**
 * Chat API Route
 * 
 * Handles chat requests using the configured AI provider.
 * Supports streaming responses and tool execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentFactory } from '@/agent/agents/factory';
import { AgentMessage, StreamEvent } from '@/agent/agents/base-provider';
import { agentLogger } from '@/agent/agents/logger';

import { ChatRequestBody, SignalData } from './types';
import { buildDataContext, formatCurrentUser } from './context-builder';
import { buildStateAwarePrompt, buildLegacyPrompt } from './prompts';
import { summarizeAttachmentsForSignal, buildToolExecutionInstructions } from './helpers';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const {
      messages,
      signals,
      cases,
      teamMembers,
      currentUser,
      lastCreatedSignalId,
      organizations,
      addresses,
      people,
      stream: enableStreaming,
      approvedPlan,
    } = body;

    // Determine provider from environment
    const providerType = AgentFactory.getProviderFromEnv();
    const isGoogleProvider = providerType.startsWith('google');

    const apiKey = isGoogleProvider
      ? (process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY)
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key is not configured for ${providerType}` },
        { status: 500 }
      );
    }

    // Build data context
    const dataContext = buildDataContext(
      signals || [],
      cases || [],
      teamMembers || [],
      organizations || [],
      addresses || [],
      people || []
    );

    // Build system prompt based on provider
    const systemPrompt = isGoogleProvider && providerType === 'google-state'
      ? buildStateAwarePrompt(dataContext, currentUser, lastCreatedSignalId)
      : buildLegacyPrompt(dataContext, currentUser, lastCreatedSignalId, approvedPlan);

    // Convert messages to agent format
    let agentMessages: AgentMessage[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // When an approved plan is provided, inject execution instructions
    if (approvedPlan) {
      const toolInstructions = buildToolExecutionInstructions(approvedPlan);
      const lastUserMsgIndex = agentMessages.length - 1;

      if (lastUserMsgIndex >= 0 && agentMessages[lastUserMsgIndex].role === 'user') {
        agentMessages[lastUserMsgIndex] = {
          role: 'user',
          content: `The plan has been APPROVED by the user. Execute the following tools NOW in order:

${toolInstructions}

IMPORTANT: Call these tools directly. Do NOT call plan_proposal. The plan is already approved.
After executing all tools, provide a brief summary of what was accomplished.`,
        };

        agentLogger.log('info', 'route', '✅ APPROVED PLAN - Injecting tool execution instructions', {
          actions: approvedPlan.actions.map((a) => ({ step: a.step, tool: a.tool })),
        });
      }
    }

    // Initialize the agent provider
    const usesMcp = isGoogleProvider;
    const provider = await AgentFactory.createProviderAsync({
      provider: providerType,
      apiKey: apiKey as string,
      agentConfig: {
        model: providerType === 'anthropic' ? 'claude-3-haiku-20240307' : 'gemini-2.5-flash',
        systemPrompt,
        maxTokens: 2048,
      },
      tools: [],
      mcpOptions: usesMcp
        ? {
          serverCommand: 'node',
          serverArgs: ['mcp-server/dist/index.js'],
        }
        : undefined,
    });

    // Streaming mode
    if (enableStreaming) {
      return handleStreamingResponse(provider, agentMessages, signals || [], approvedPlan);
    }

    // Non-streaming mode
    const response = await provider.sendMessage(agentMessages);

    return NextResponse.json({
      content: response.content,
      toolUses: response.toolCalls?.map((tc) => ({
        name: tc.name,
        input: tc.input,
        result: JSON.stringify({ success: true }),
      })),
      stopReason: response.finishReason,
      requiresApproval: response.requiresApproval,
      approvalRequest: response.approvalRequest,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}

/**
 * Handle streaming response
 */
function handleStreamingResponse(
  provider: Awaited<ReturnType<typeof AgentFactory.createProviderAsync>>,
  agentMessages: AgentMessage[],
  signals: SignalData[],
  approvedPlan?: ChatRequestBody['approvedPlan']
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...(data as object) })}\n\n`));
      };

      let allToolResults: { name: string; input: Record<string, unknown>; result?: string }[] = [];
      let currentPlanStep = 0;
      let accumulatedText = ''; // Accumulate text from thinking events

      try {
        await provider.streamMessage(agentMessages, async (event: StreamEvent) => {
          switch (event.type) {
            case 'phase':
              sendEvent('phase', event.data);
              break;

            case 'thinking': {
              const thinkingData = event.data as { text?: string };
              if (thinkingData.text) {
                accumulatedText += thinkingData.text;
              }
              sendEvent('thinking', event.data);
              break;
            }

            case 'tool_executed': {
              const executedTool = event.data as {
                tool: string;
                input: Record<string, unknown>;
                status: string;
              };

              if (executedTool.tool === 'ask_clarification') {
                sendEvent('clarification', executedTool.input);
                sendEvent('phase', { phase: 'clarifying' });
                return;
              }

              if (executedTool.tool === 'plan_proposal') {
                if (approvedPlan) return;
                sendEvent('plan_proposal', executedTool.input);
                sendEvent('phase', { phase: 'awaiting_approval' });
                return;
              }

              sendEvent('tool_result', {
                tool: executedTool.tool,
                result: 'Executed by backend',
                status: 'success',
              });
              break;
            }

            case 'tool_call': {
              const toolCall = event.data as { tool: string; input: Record<string, unknown> };

              if (toolCall.tool === 'plan_proposal') {
                if (approvedPlan) return;
                sendEvent('plan_proposal', toolCall.input);
                sendEvent('phase', { phase: 'awaiting_approval' });
                return;
              }

              if (toolCall.tool === 'ask_clarification') {
                sendEvent('clarification', toolCall.input);
                sendEvent('phase', { phase: 'clarifying' });
                return;
              }

              let toolInput = toolCall.input;
              if (approvedPlan) {
                currentPlanStep++;
                const planAction = approvedPlan.actions.find((a) => a.step === currentPlanStep);
                if (planAction?.details) {
                  toolInput = planAction.details;
                }
              }

              sendEvent('tool_call', { tool: toolCall.tool, input: toolInput });

              // Execute special tools
              let result = '';
              if (toolCall.tool === 'summarize_attachments') {
                const signalId = (toolInput as { signal_id: string }).signal_id;
                result = await summarizeAttachmentsForSignal(signalId, signals);
              } else {
                result = JSON.stringify({ success: true, tool: toolCall.tool, input: toolInput });
              }

              allToolResults.push({ name: toolCall.tool, input: toolInput, result });
              sendEvent('tool_result', { tool: toolCall.tool, result, status: 'success' });
              break;
            }

            case 'approval_required':
              sendEvent('phase', { phase: 'awaiting_approval' });
              sendEvent('approval_required', event.data);
              break;

            case 'clarification_needed':
              sendEvent('clarification', event.data);
              sendEvent('phase', { phase: 'clarifying' });
              break;

            case 'plan_proposal':
              if (!approvedPlan) {
                sendEvent('plan_proposal', event.data);
                sendEvent('phase', { phase: 'awaiting_approval' });
              }
              break;

            case 'response': {
              const responseData = event.data as { content: string; toolCalls?: unknown[] };
              // Use accumulated text if response content is empty
              const responseText = responseData.content || accumulatedText;
              sendEvent('phase', { phase: 'complete' });
              sendEvent('response', {
                text: responseText,
                toolResults: allToolResults,
              });
              break;
            }

            case 'error':
              sendEvent('error', event.data);
              break;
          }
        });
      } catch (err) {
        console.error('Streaming provider error:', err);
        sendEvent('error', { message: 'Stream processing failed' });
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
