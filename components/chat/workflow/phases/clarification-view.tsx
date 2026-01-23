'use client';

import { useState } from 'react';
import { ClarificationQuestion } from '@/types/conversation-workflow';
import { useWorkflow } from '../hooks/use-workflow';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

interface ClarificationViewProps {
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ClarificationView({
  onComplete,
  onCancel,
  className = '',
}: ClarificationViewProps) {
  const {
    state,
    answerQuestion,
    completeClarification,
    exitWorkflow,
  } = useWorkflow();

  const { questions, currentQuestionIndex, originalRequest } = state.clarification;
  const [textInput, setTextInput] = useState('');

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((q) => q.answer !== undefined).length;
  const allAnswered = answeredCount === questions.length;

  const handleTextSubmit = (questionId: string) => {
    if (textInput.trim()) {
      answerQuestion(questionId, textInput.trim());
      setTextInput('');
    }
  };

  const handleChoiceSelect = (questionId: string, choice: string) => {
    answerQuestion(questionId, choice);
  };

  const handleMultiSelect = (questionId: string, option: string, currentAnswers: string[]) => {
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter((a) => a !== option)
      : [...currentAnswers, option];
    answerQuestion(questionId, newAnswers);
  };

  const handleConfirmation = (questionId: string, confirmed: boolean) => {
    answerQuestion(questionId, confirmed ? 'yes' : 'no');
  };

  const handleContinue = () => {
    completeClarification();
    if (onComplete) {
      onComplete();
    }
  };

  const handleCancel = () => {
    exitWorkflow();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Clarifying Requirements</h3>
            <p className="text-sm text-blue-700">
              {answeredCount} of {questions.length} questions answered
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Original request summary */}
      {originalRequest && (
        <div className="px-4 py-2 bg-gray-50 border-b">
          <p className="text-xs text-gray-500">Your request:</p>
          <p className="text-sm text-gray-700 truncate">{originalRequest}</p>
        </div>
      )}

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {questions.map((question, index) => {
          const isAnswered = question.answer !== undefined;
          const isCurrent = index === currentQuestionIndex;

          return (
            <div
              key={question.id}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isCurrent && !isAnswered ? 'border-blue-500 bg-blue-50 shadow-md' : ''}
                ${isAnswered ? 'border-green-200 bg-green-50' : ''}
                ${!isCurrent && !isAnswered ? 'border-gray-200 bg-white opacity-60' : ''}
              `}
            >
              {/* Question header */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isAnswered ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {question.question}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>

                  {/* Answer display if answered */}
                  {isAnswered && (
                    <p className="mt-1 text-sm text-green-700">
                      Answer: {Array.isArray(question.answer) ? question.answer.join(', ') : question.answer}
                    </p>
                  )}

                  {/* Input based on question type (only show for current unanswered question) */}
                  {isCurrent && !isAnswered && (
                    <div className="mt-3">
                      {question.type === 'text' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTextSubmit(question.id);
                              }
                            }}
                            placeholder="Type your answer..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleTextSubmit(question.id)}
                            disabled={!textInput.trim()}
                            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Submit
                          </button>
                        </div>
                      )}

                      {question.type === 'choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleChoiceSelect(question.id, option)}
                              className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {question.type === 'multi-select' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => {
                            const currentAnswers = Array.isArray(question.answer) ? question.answer : [];
                            const isSelected = currentAnswers.includes(option);

                            return (
                              <button
                                key={option}
                                onClick={() => handleMultiSelect(question.id, option, currentAnswers)}
                                className={`
                                  w-full text-left px-3 py-2 text-sm border rounded-lg transition-colors
                                  ${isSelected ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'}
                                `}
                              >
                                <span className="mr-2">{isSelected ? '☑' : '☐'}</span>
                                {option}
                              </button>
                            );
                          })}
                          {(question.answer as string[] | undefined)?.length && (
                            <button
                              onClick={() => answerQuestion(question.id, question.answer as string[])}
                              className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                            >
                              Confirm Selection
                            </button>
                          )}
                        </div>
                      )}

                      {question.type === 'confirmation' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmation(question.id, true)}
                            className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleConfirmation(question.id, false)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <button
          onClick={handleContinue}
          disabled={!allAnswered}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${
              allAnswered
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue to Planning
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
