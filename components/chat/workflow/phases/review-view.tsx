'use client';

import { useWorkflow } from '../hooks/use-workflow';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import { ReviewItem } from '@/types/conversation-workflow';

interface ReviewViewProps {
  onNewTask?: () => void;
  onExit?: () => void;
  className?: string;
}

function getStatusIcon(status: ReviewItem['status']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  }
}

function getStatusBgColor(status: ReviewItem['status']) {
  switch (status) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
  }
}

function getOverallStatusInfo(status: 'success' | 'partial' | 'failed') {
  switch (status) {
    case 'success':
      return {
        icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        title: 'All Tasks Completed',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
      };
    case 'partial':
      return {
        icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
        title: 'Partially Completed',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
      };
    case 'failed':
      return {
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        title: 'Execution Failed',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
      };
  }
}

export function ReviewView({
  onNewTask,
  onExit,
  className = '',
}: ReviewViewProps) {
  const { state, requestNewTask, exitWorkflow } = useWorkflow();
  const { items, summary, overallStatus } = state.review;
  const statusInfo = getOverallStatusInfo(overallStatus);

  const handleNewTask = () => {
    requestNewTask();
    if (onNewTask) {
      onNewTask();
    }
  };

  const handleExit = () => {
    exitWorkflow();
    if (onExit) {
      onExit();
    }
  };

  const successCount = items.filter((i) => i.status === 'success').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with overall status */}
      <div className={`px-4 py-4 border-b ${statusInfo.bgColor}`}>
        <div className="flex items-center gap-3">
          {statusInfo.icon}
          <div>
            <h3 className={`font-semibold ${statusInfo.textColor}`}>
              {statusInfo.title}
            </h3>
            <p className="text-sm text-gray-600">{summary}</p>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-gray-700">{successCount} successful</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-gray-700">{errorCount} failed</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-700">{warningCount} warnings</span>
          </div>
        )}
      </div>

      {/* Review items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.taskId}
            className={`p-3 rounded-lg border ${getStatusBgColor(item.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm">
                  {item.taskTitle}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">{item.summary}</p>
                {item.details && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No review items available
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            Done
          </button>

          <button
            onClick={handleNewTask}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Start New Task
          </button>
        </div>
      </div>
    </div>
  );
}
