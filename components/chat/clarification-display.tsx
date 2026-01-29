'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle, X } from 'lucide-react';

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'multi-select';
  options?: string[];
  required: boolean;
  fieldName?: string;
  toolName?: string;
}

export interface ClarificationData {
  summary: string;
  questions: ClarificationQuestion[];
}

interface ClarificationDisplayProps {
  data: ClarificationData;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onCancel: () => void;
}

export function ClarificationDisplay({ data, onSubmit, onCancel }: ClarificationDisplayProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleChoiceSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelectToggle = (questionId: string, value: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter(v => v !== value) };
      }
      return { ...prev, [questionId]: [...current, value] };
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    const allRequiredAnswered = data.questions
      .filter(q => q.required)
      .every(q => {
        const answer = answers[q.id];
        if (Array.isArray(answer)) return answer.length > 0;
        return answer && answer.trim().length > 0;
      });

    if (!allRequiredAnswered) {
      // Could show an error, but for now just don't submit
      return;
    }

    onSubmit(answers);
  };

  const canSubmit = data.questions
    .filter(q => q.required)
    .every(q => {
      const answer = answers[q.id];
      if (Array.isArray(answer)) return answer.length > 0;
      return answer && (typeof answer === 'string' ? answer.trim().length > 0 : true);
    });

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
          <HelpCircle className="w-4 h-4" />
          Need More Information
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded"
        >
          <X className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </button>
      </div>

      <div className="text-xs text-amber-800 dark:text-amber-200 mb-3">
        {data.summary}
      </div>

      <div className="space-y-3">
        {data.questions.map((question) => (
          <div key={question.id} className="space-y-1.5">
            <label className="text-xs font-medium text-amber-900 dark:text-amber-100">
              {question.question}
              {question.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {question.type === 'text' && (
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}

            {question.type === 'choice' && question.options && (
              <div className="flex flex-wrap gap-1.5">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChoiceSelect(question.id, option)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full border transition-colors',
                      answers[question.id] === option
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'multi-select' && question.options && (
              <div className="flex flex-wrap gap-1.5">
                {question.options.map((option) => {
                  const selected = ((answers[question.id] as string[]) || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleMultiSelectToggle(question.id, option)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full border transition-colors',
                        selected
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
        >
          Continue
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
