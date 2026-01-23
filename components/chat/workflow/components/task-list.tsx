'use client';

import { PlanTask } from '@/types/conversation-workflow';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertCircle,
  GripVertical,
  Trash2,
} from 'lucide-react';

interface TaskListProps {
  tasks: PlanTask[];
  showStatus?: boolean;
  editable?: boolean;
  currentTaskId?: string | null;
  onRemoveTask?: (taskId: string) => void;
  onReorderTasks?: (tasks: PlanTask[]) => void;
  className?: string;
}

function getStatusIcon(status: PlanTask['status'], isCurrent: boolean) {
  if (isCurrent && status === 'in_progress') {
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
  }

  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'skipped':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'in_progress':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'pending':
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
}

function getStatusBorderColor(status: PlanTask['status'], isCurrent: boolean) {
  if (isCurrent) {
    return 'border-blue-500 bg-blue-50';
  }

  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50';
    case 'failed':
      return 'border-red-200 bg-red-50';
    case 'skipped':
      return 'border-yellow-200 bg-yellow-50';
    case 'in_progress':
      return 'border-blue-200 bg-blue-50';
    case 'pending':
    default:
      return 'border-gray-200 bg-white';
  }
}

export function TaskList({
  tasks,
  showStatus = true,
  editable = false,
  currentTaskId,
  onRemoveTask,
  className = '',
}: TaskListProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedTasks.map((task, index) => {
        const isCurrent = currentTaskId === task.id;
        const borderColor = getStatusBorderColor(task.status, isCurrent);

        return (
          <div
            key={task.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200
              ${borderColor}
              ${isCurrent ? 'shadow-md' : ''}
            `}
          >
            {/* Drag handle (if editable) */}
            {editable && (
              <div className="cursor-grab text-gray-400 hover:text-gray-600 mt-0.5">
                <GripVertical className="w-5 h-5" />
              </div>
            )}

            {/* Order number */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {index + 1}
            </div>

            {/* Status icon */}
            {showStatus && (
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(task.status, isCurrent)}
              </div>
            )}

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>

              {/* Show result or error if present */}
              {task.result && (
                <p className="text-xs text-green-600 mt-1 italic">
                  Result: {task.result}
                </p>
              )}
              {task.error && (
                <p className="text-xs text-red-600 mt-1 italic">
                  Error: {task.error}
                </p>
              )}

              {/* Dependencies */}
              {task.dependencies.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Depends on: {task.dependencies.join(', ')}
                </p>
              )}
            </div>

            {/* Remove button (if editable) */}
            {editable && onRemoveTask && (
              <button
                onClick={() => onRemoveTask(task.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks to display
        </div>
      )}
    </div>
  );
}
