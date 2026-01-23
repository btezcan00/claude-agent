'use client';

import { useCallback, useState } from 'react';
import { ComplexityAnalysis, ClarificationQuestion } from '@/types/conversation-workflow';

interface PhaseDetectionOptions {
  onComplexRequest?: (analysis: ComplexityAnalysis) => void;
}

interface PhaseDetectionResult {
  isAnalyzing: boolean;
  lastAnalysis: ComplexityAnalysis | null;
  analyzeRequest: (message: string, context?: Record<string, unknown>) => Promise<ComplexityAnalysis>;
  shouldStartWorkflow: (analysis: ComplexityAnalysis) => boolean;
}

// Keywords that suggest a complex request
const COMPLEX_KEYWORDS = [
  'create',
  'build',
  'implement',
  'set up',
  'configure',
  'migrate',
  'refactor',
  'integrate',
  'automate',
  'analyze and',
  'multiple',
  'all',
  'every',
  'batch',
  'bulk',
  'across',
  'comprehensive',
  'complete',
  'full',
  'entire',
];

// Keywords that suggest simple requests
const SIMPLE_KEYWORDS = [
  'what is',
  'how do',
  'show me',
  'list',
  'find',
  'get',
  'tell me',
  'explain',
  'help with',
  'status',
  'check',
];

export function usePhaseDetection(options?: PhaseDetectionOptions): PhaseDetectionResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<ComplexityAnalysis | null>(null);

  // Local heuristic analysis (fast, no API call)
  const performLocalAnalysis = useCallback((message: string): ComplexityAnalysis => {
    const lowerMessage = message.toLowerCase();

    // Check word count - longer messages tend to be more complex
    const wordCount = message.split(/\s+/).length;

    // Check for complex keywords
    const hasComplexKeywords = COMPLEX_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // Check for simple keywords
    const hasSimpleKeywords = SIMPLE_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    // Check for multiple sentences (indicates multiple requirements)
    const sentenceCount = message.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Check for list indicators
    const hasListIndicators = /(\d+\.|•|-|\*)\s/.test(message) ||
      message.includes(' and ') && message.includes(',');

    // Determine complexity
    let isComplex = false;
    let reason = '';
    let suggestedQuestions: ClarificationQuestion[] = [];

    if (hasSimpleKeywords && !hasComplexKeywords && wordCount < 15) {
      isComplex = false;
      reason = 'Simple query detected';
    } else if (hasComplexKeywords || wordCount > 30 || sentenceCount > 2 || hasListIndicators) {
      isComplex = true;
      reason = 'Complex request with multiple requirements';

      // Generate suggested questions based on detected complexity
      if (hasListIndicators || sentenceCount > 2) {
        suggestedQuestions.push({
          id: 'priority',
          question: 'Which of these tasks should be prioritized first?',
          type: 'choice',
          options: ['First mentioned', 'Most impactful', 'Quickest wins first'],
          required: false,
        });
      }

      if (lowerMessage.includes('create') || lowerMessage.includes('build')) {
        suggestedQuestions.push({
          id: 'details',
          question: 'Do you have specific requirements or preferences for the implementation?',
          type: 'text',
          required: true,
        });
      }

      if (lowerMessage.includes('all') || lowerMessage.includes('every') || lowerMessage.includes('bulk')) {
        suggestedQuestions.push({
          id: 'scope',
          question: 'Should this apply to all items, or would you like to select specific ones?',
          type: 'choice',
          options: ['All items', 'Let me select specific items'],
          required: true,
        });
      }
    } else {
      isComplex = false;
      reason = 'Standard request';
    }

    return {
      isComplex,
      reason,
      suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
    };
  }, []);

  // Full analysis (can be extended to use API)
  const analyzeRequest = useCallback(
    async (message: string, _context?: Record<string, unknown>): Promise<ComplexityAnalysis> => {
      setIsAnalyzing(true);

      try {
        // For now, use local heuristic analysis
        // This can be extended to call the API's analyze_request_complexity tool
        const analysis = performLocalAnalysis(message);

        setLastAnalysis(analysis);

        if (analysis.isComplex && options?.onComplexRequest) {
          options.onComplexRequest(analysis);
        }

        return analysis;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [performLocalAnalysis, options]
  );

  const shouldStartWorkflow = useCallback((analysis: ComplexityAnalysis): boolean => {
    return analysis.isComplex;
  }, []);

  return {
    isAnalyzing,
    lastAnalysis,
    analyzeRequest,
    shouldStartWorkflow,
  };
}
