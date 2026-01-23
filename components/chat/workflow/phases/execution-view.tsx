'use client';

import { useWorkflow } from '../hooks/use-workflow';
import { TaskList } from '../components/task-list';
import { ProgressTracker } from '../components/progress-tracker';
import { Pause, Play, X, AlertTriangle } from 'lucide-react';

interface ExecutionViewProps {
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ExecutionView({
  onPause,
  onResume,
  onCancel,
  className = '',
}: ExecutionViewProps) {
  const {
    state,
    pauseExecution,
    resumeExecution,
    cancelExecution,
  } = useWorkflow();

  const { progress, isPaused, isCancelled } = state.execution;
  const { currentPlan } = state.planning;

  const handlePause = () => {
    pauseExecution();
    if (onPause) {
      onPause();
    }
  };

  const handleResume = () => {
    resumeExecution();
    if (onResume) {
      onResume();
    }
  };

  const handleCancel = () => {
    cancelExecution();
    if (onCancel) {
      onCancel();
    }
  };

  if (!currentPlan) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}>
        <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
        <p className="text-gray-600">No plan available for execution</p>
      </div>
    );
  }

  const currentTask = currentPlan.tasks.find((t) => t.id === progress.currentTaskId);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-amber-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-amber-900">
              {isCancelled ? 'Execution Cancelled' : isPaused ? 'Execution Paused' : 'Executing...'}
            </h3>
            <p className="text-sm text-amber-700">
              {currentTask ? `Current: ${currentTask.title}` : 'Preparing...'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="px-4 py-3 bg-white border-b">
        <ProgressTracker progress={progress} showDetails />
      </div>

      {/* Task list with status */}
      <div className="flex-1 overflow-y-auto p-4">
        <TaskList
          tasks={currentPlan.tasks}
          showStatus
          currentTaskId={progress.currentTaskId}
        />
      </div>

      {/* Paused/Cancelled indicator */}
      {isPaused && !isCancelled && (
        <div className="px-4 py-2 bg-yellow-100 border-t border-yellow-200">
          <div className="flex items-center gap-2">
            <Pause className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Execution paused. Click Resume to continue.
            </span>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="px-4 py-2 bg-red-100 border-t border-red-200">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">
              Execution cancelled. Remaining tasks will be skipped.
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          {!isCancelled && (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}

              <button
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
