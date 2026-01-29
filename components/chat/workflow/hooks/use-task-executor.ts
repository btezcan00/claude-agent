'use client';

import { useCallback, useRef, useState } from 'react';
import { PlanTask, ReviewItem } from '@/types/conversation-workflow';
import { useWorkflow } from './use-workflow';

interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  result?: string;
  error?: string;
}

interface TaskExecutorOptions {
  onTaskStart?: (task: PlanTask) => void;
  onTaskComplete?: (task: PlanTask, result: TaskExecutionResult) => void;
  onAllComplete?: (results: TaskExecutionResult[]) => void;
  onError?: (task: PlanTask, error: Error) => void;
  executeTask: (task: PlanTask) => Promise<TaskExecutionResult>;
}

interface TaskExecutorResult {
  isExecuting: boolean;
  currentTask: PlanTask | null;
  results: TaskExecutionResult[];
  execute: (tasks: PlanTask[]) => Promise<TaskExecutionResult[]>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function useTaskExecutor(options: TaskExecutorOptions): TaskExecutorResult {
  const { updateTaskStatus, setCurrentTask, completeExecution, setReview } = useWorkflow();

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTask, setCurrentTaskLocal] = useState<PlanTask | null>(null);
  const [results, setResults] = useState<TaskExecutionResult[]>([]);

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  const execute = useCallback(
    async (tasks: PlanTask[]): Promise<TaskExecutionResult[]> => {
      setIsExecuting(true);
      setResults([]);
      isPausedRef.current = false;
      isCancelledRef.current = false;

      const executionResults: TaskExecutionResult[] = [];

      // Sort tasks by order and dependencies
      const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

      for (const task of sortedTasks) {
        // Check if cancelled
        if (isCancelledRef.current) {
          // Mark remaining tasks as skipped
          updateTaskStatus(task.id, 'skipped');
          executionResults.push({
            taskId: task.id,
            success: false,
            error: 'Execution cancelled',
          });
          continue;
        }

        // Wait while paused
        while (isPausedRef.current && !isCancelledRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (isCancelledRef.current) {
          updateTaskStatus(task.id, 'skipped');
          executionResults.push({
            taskId: task.id,
            success: false,
            error: 'Execution cancelled',
          });
          continue;
        }

        // Check dependencies
        const dependenciesMet = task.dependencies.every(depId => {
          const depResult = executionResults.find(r => r.taskId === depId);
          return depResult?.success;
        });

        if (!dependenciesMet) {
          updateTaskStatus(task.id, 'skipped', undefined, 'Dependencies not met');
          executionResults.push({
            taskId: task.id,
            success: false,
            error: 'Dependencies not met',
          });
          continue;
        }

        // Set current task
        setCurrentTaskLocal(task);
        setCurrentTask(task.id);
        updateTaskStatus(task.id, 'in_progress');

        if (options.onTaskStart) {
          options.onTaskStart(task);
        }

        try {
          // Execute the task
          const result = await options.executeTask(task);

          executionResults.push(result);
          setResults(prev => [...prev, result]);

          updateTaskStatus(
            task.id,
            result.success ? 'completed' : 'failed',
            result.result,
            result.error
          );

          if (options.onTaskComplete) {
            options.onTaskComplete(task, result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const result: TaskExecutionResult = {
            taskId: task.id,
            success: false,
            error: errorMessage,
          };

          executionResults.push(result);
          setResults(prev => [...prev, result]);
          updateTaskStatus(task.id, 'failed', undefined, errorMessage);

          if (options.onError) {
            options.onError(task, error instanceof Error ? error : new Error(errorMessage));
          }
        }
      }

      // Generate review items
      const reviewItems: ReviewItem[] = sortedTasks.map(task => {
        const result = executionResults.find(r => r.taskId === task.id);
        let status: ReviewItem['status'] = 'success';

        if (!result?.success) {
          status = result?.error === 'Execution cancelled' || result?.error === 'Dependencies not met'
            ? 'warning'
            : 'error';
        }

        return {
          taskId: task.id,
          taskTitle: task.title,
          status,
          summary: result?.result || result?.error || 'No result',
        };
      });

      // Determine overall status
      const successCount = executionResults.filter(r => r.success).length;
      const failureCount = executionResults.filter(r => !r.success).length;
      let overallStatus: 'success' | 'partial' | 'failed' = 'success';

      if (failureCount === executionResults.length) {
        overallStatus = 'failed';
      } else if (failureCount > 0) {
        overallStatus = 'partial';
      }

      // Set review
      const summary = `Completed ${successCount} of ${executionResults.length} tasks${
        failureCount > 0 ? ` (${failureCount} failed)` : ''
      }`;
      setReview(reviewItems, summary, overallStatus);

      // Complete execution
      setCurrentTaskLocal(null);
      setCurrentTask(null);
      setIsExecuting(false);
      completeExecution();

      if (options.onAllComplete) {
        options.onAllComplete(executionResults);
      }

      return executionResults;
    },
    [options, updateTaskStatus, setCurrentTask, completeExecution, setReview]
  );

  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
  }, []);

  return {
    isExecuting,
    currentTask,
    results,
    execute,
    pause,
    resume,
    cancel,
  };
}
