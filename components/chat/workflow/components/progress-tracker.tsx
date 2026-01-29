'use client';

import { ExecutionProgress } from '@/types/conversation-workflow';

interface ProgressTrackerProps {
  progress: ExecutionProgress;
  showDetails?: boolean;
  className?: string;
}

export function ProgressTracker({
  progress,
  showDetails = true,
  className = '',
}: ProgressTrackerProps) {
  const { totalTasks, completedTasks, failedTasks, percentage } = progress;
  const pendingTasks = totalTasks - completedTasks - failedTasks;

  // Determine progress bar color based on failures
  const getProgressColor = () => {
    if (failedTasks > 0 && completedTasks === 0) {
      return 'bg-red-500';
    }
    if (failedTasks > 0) {
      return 'bg-yellow-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Completed portion */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Animated pulse on the leading edge */}
        {percentage > 0 && percentage < 100 && (
          <div
            className="absolute top-0 h-full w-2 bg-white/30 animate-pulse"
            style={{ left: `${Math.max(0, percentage - 2)}%` }}
          />
        )}
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {percentage}% Complete
        </span>
        {showDetails && (
          <span className="text-gray-500">
            {completedTasks} of {totalTasks} tasks
          </span>
        )}
      </div>

      {/* Detailed breakdown */}
      {showDetails && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Completed: {completedTasks}</span>
          </div>
          {failedTasks > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Failed: {failedTasks}</span>
            </div>
          )}
          {pendingTasks > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">Pending: {pendingTasks}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini version for header
interface MiniProgressProps {
  percentage: number;
  className?: string;
}

export function MiniProgress({ percentage, className = '' }: MiniProgressProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600">{percentage}%</span>
    </div>
  );
}
