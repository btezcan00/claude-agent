'use client';

import { useState } from 'react';
import { useWorkflow } from '../hooks/use-workflow';
import { TaskList } from '../components/task-list';
import { FeedbackInput } from '../components/feedback-input';
import { ArrowRight, ArrowLeft, X, RefreshCw, CheckCircle } from 'lucide-react';
import { PlanTask } from '@/types/conversation-workflow';

interface PlanningViewProps {
  onConfirm?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  onRequestRevision?: (feedback: string) => Promise<void>;
  className?: string;
}

export function PlanningView({
  onConfirm,
  onBack,
  onCancel,
  onRequestRevision,
  className = '',
}: PlanningViewProps) {
  const {
    state,
    confirmPlan,
    updatePlan,
    addPlanFeedback,
    goBack,
    exitWorkflow,
  } = useWorkflow();

  const { currentPlan, userFeedback, isConfirmed } = state.planning;
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleConfirm = () => {
    confirmPlan();
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleBack = () => {
    goBack();
    if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    exitWorkflow();
    if (onCancel) {
      onCancel();
    }
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    addPlanFeedback(feedback);
    setShowFeedback(false);

    if (onRequestRevision) {
      setIsRequestingRevision(true);
      try {
        await onRequestRevision(feedback);
      } finally {
        setIsRequestingRevision(false);
      }
    }
  };

  const handleRemoveTask = (taskId: string) => {
    if (!currentPlan) return;

    const updatedTasks = currentPlan.tasks
      .filter((t) => t.id !== taskId)
      .map((t, index) => ({
        ...t,
        order: index,
        dependencies: t.dependencies.filter((d) => d !== taskId),
      }));

    updatePlan({ tasks: updatedTasks });
  };

  if (!currentPlan) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Generating execution plan...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-purple-900">Execution Plan</h3>
            <p className="text-sm text-purple-700">
              {currentPlan.tasks.length} tasks • Version {currentPlan.version}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-purple-400 hover:text-purple-600 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Plan description */}
      <div className="px-4 py-3 bg-white border-b">
        <h4 className="font-medium text-gray-900">{currentPlan.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{currentPlan.description}</p>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4">
        <TaskList
          tasks={currentPlan.tasks}
          showStatus={false}
          editable={!isConfirmed}
          onRemoveTask={handleRemoveTask}
        />
      </div>

      {/* Previous feedback */}
      {userFeedback.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs font-medium text-yellow-800">Previous feedback:</p>
          <ul className="text-xs text-yellow-700 mt-1 space-y-1">
            {userFeedback.map((fb, index) => (
              <li key={index}>• {fb}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback input */}
      {showFeedback && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <FeedbackInput
            onSubmit={handleFeedbackSubmit}
            placeholder="Describe what changes you'd like to make to the plan..."
            buttonLabel="Request Revision"
            disabled={isRequestingRevision}
          />
          <button
            onClick={() => setShowFeedback(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Revision loading indicator */}
      {isRequestingRevision && (
        <div className="px-4 py-3 bg-blue-50 border-t flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-700">Revising plan based on your feedback...</span>
        </div>
      )}

      {/* Footer */}
      {!showFeedback && !isRequestingRevision && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => setShowFeedback(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Request Changes
            </button>

            <button
              onClick={handleConfirm}
              disabled={currentPlan.tasks.length === 0}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${
                  currentPlan.tasks.length > 0
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <CheckCircle className="w-4 h-4" />
              Confirm & Execute
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
