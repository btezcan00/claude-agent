/**
 * Chat API - Helper Functions
 */

import Anthropic from '@anthropic-ai/sdk';
import { SignalData, ApprovedPlan } from './types';

// Anthropic client for vision/attachment analysis
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Summarize attachments for a signal using Claude Vision
 */
export async function summarizeAttachmentsForSignal(
    signalId: string,
    signals: SignalData[]
): Promise<string> {
    // Find the signal by ID or signal number
    const targetSignal = signals.find(
        (s) =>
            s.id === signalId ||
            s.signalNumber.toLowerCase() === signalId.toLowerCase() ||
            s.signalNumber.toLowerCase().includes(signalId.toLowerCase())
    );

    if (!targetSignal) {
        return `Signal "${signalId}" not found.`;
    }

    const attachments = targetSignal.attachments || [];
    if (attachments.length === 0) {
        return `Signal ${targetSignal.signalNumber} has no attachments.`;
    }

    // Filter to only attachments with content
    const attachmentsWithContent = attachments.filter((a) => a.content);
    if (attachmentsWithContent.length === 0) {
        return `Signal ${targetSignal.signalNumber} has ${attachments.length} attachment(s), but none have accessible content for analysis.`;
    }

    // Build multimodal content array
    const content: Anthropic.MessageParam['content'] = [];

    // Add instruction text
    content.push({
        type: 'text',
        text: `Please analyze and summarize the following ${attachmentsWithContent.length} attachment(s) for signal ${targetSignal.signalNumber} ("${targetSignal.description.substring(0, 50)}..."). For each attachment, provide a brief description of its contents and any relevant information that could be useful for the investigation.`,
    });

    // Add each attachment
    for (const attachment of attachmentsWithContent) {
        const isImage = attachment.fileType.startsWith('image/');

        if (isImage && attachment.content) {
            // Extract base64 data (remove data URL prefix)
            const base64Data = attachment.content.split(',')[1];
            if (base64Data) {
                const mediaType = attachment.fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
                content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: base64Data,
                    },
                });
                content.push({
                    type: 'text',
                    text: `[Image file: ${attachment.fileName}]`,
                });
            }
        } else if (attachment.textContent) {
            // For text-based files, include extracted text
            content.push({
                type: 'text',
                text: `[Document: ${attachment.fileName}]\n\nContent:\n${attachment.textContent.substring(0, 5000)}${attachment.textContent.length > 5000 ? '\n... (content truncated)' : ''}`,
            });
        } else {
            // For other files without extractable content
            content.push({
                type: 'text',
                text: `[File: ${attachment.fileName} (${attachment.fileType}) - Content not available for direct analysis]`,
            });
        }
    }

    try {
        // Make vision-capable API call
        const summaryResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2048,
            messages: [{ role: 'user', content }],
        });

        // Extract text from response
        const summaryText = summaryResponse.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map((block) => block.text)
            .join('\n');

        return summaryText || 'Unable to generate summary.';
    } catch (error) {
        console.error('Error summarizing attachments:', error);
        return 'Failed to analyze attachments. Please try again.';
    }
}

/**
 * Validate plan_proposal for placeholder values that indicate missing information
 */
export function validatePlanProposal(plan: ApprovedPlan): {
    isValid: boolean;
    missingFields: string[];
} {
    const placeholderPatterns = [
        /\[please\s*(specify|clarify|provide)/i,
        /\[unknown\]/i,
        /\[required\]/i,
        /\[missing\]/i,
        /<unknown>/i,
        /not[_\s]?provided/i,
        /^unknown$/i,
        /^unspecified$/i,
        /^n\/a$/i,
        /^tbd$/i,
        /^to be determined$/i,
    ];

    const fallbackTypes = ['other'];

    const requiredFields: Record<string, string[]> = {
        create_signal: ['types', 'placeOfObservation'],
    };

    const result = { isValid: true, missingFields: [] as string[] };

    for (const action of plan.actions) {
        const required = requiredFields[action.tool] || [];
        const details = action.details || {};

        for (const field of required) {
            const value = details[field];

            // Missing or empty
            if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
                result.isValid = false;
                result.missingFields.push(`${action.tool}.${field}`);
                continue;
            }

            // Special handling for 'types' field - check if only fallback types
            if (field === 'types' && Array.isArray(value)) {
                const onlyFallbacks = value.every(
                    (t) => typeof t === 'string' && fallbackTypes.includes(t.toLowerCase())
                );
                if (onlyFallbacks) {
                    result.isValid = false;
                    result.missingFields.push(`${action.tool}.${field}`);
                    continue;
                }
            }

            // Check for placeholder patterns in string values
            const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
            if (placeholderPatterns.some((p) => p.test(valueStr))) {
                result.isValid = false;
                result.missingFields.push(`${action.tool}.${field}`);
            }
        }
    }

    return result;
}

/**
 * Build tool execution instructions for approved plan
 */
export function buildToolExecutionInstructions(approvedPlan: ApprovedPlan): string {
    return approvedPlan.actions
        .map((action) => {
            const paramsStr = action.details
                ? JSON.stringify(action.details, null, 2)
                : 'Use appropriate parameters';
            return `Step ${action.step}: Call ${action.tool} with parameters:\n${paramsStr}`;
        })
        .join('\n\n');
}
