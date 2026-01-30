'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export type AgentPhase = 'idle' | 'clarifying' | 'planning' | 'awaiting_approval' | 'executing' | 'reflecting' | 'complete';

export interface PlanAction {
  step: number;
  action: string;
  tool: string;
  details?: Record<string, unknown>;
}

export interface PlanData {
  summary: string;
  actions: PlanAction[];
}

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

export interface LogEntry {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'reflection' | 'error' | 'plan' | 'clarification';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  toolName?: string;
  toolInput?: Record<string, unknown>;
  planData?: PlanData;
  clarificationData?: ClarificationData;
}

interface StepsIndicatorProps {
  stepCount: number;
  isProcessing: boolean;
  isExpanded: boolean;
}

function StepsIndicator({ stepCount, isProcessing, isExpanded }: StepsIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {isProcessing && (
        <Sparkles className="w-4 h-4 text-[--claude-coral] animate-pulse" />
      )}
      <span className="font-medium">
        {stepCount} {stepCount === 1 ? 'step' : 'steps'}
      </span>
      <ChevronRight
        className={cn(
          'w-4 h-4 transition-transform duration-200',
          isExpanded && 'rotate-90'
        )}
      />
    </div>
  );
}

interface PlanDisplayProps {
  plan: PlanData;
  onApprove?: () => void;
  onReject?: (feedback: string) => void;
  isAwaitingApproval?: boolean;
}

export function PlanDisplay({ plan, onApprove, onReject, isAwaitingApproval }: PlanDisplayProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleReviseClick = () => {
    setShowFeedback(true);
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim() && onReject) {
      onReject(feedback.trim());
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedback(false);
    setFeedback('');
  };

  return (
    <div className="bg-claude-beige rounded-lg p-3 border border-border overflow-hidden">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Clock className="w-4 h-4" />
        Proposed Plan
      </div>
      <div className="text-xs text-muted-foreground mb-3 break-words">
        {plan.summary}
      </div>
      <div className="space-y-2">
        {plan.actions.map((action) => (
          <div key={action.step} className="flex items-start gap-2 text-xs">
            <span className="bg-claude-beige-dark text-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
              {action.step}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium break-words">{action.action}</span>
              <span className="text-muted-foreground ml-1">({action.tool})</span>
              {action.details && Object.keys(action.details).length > 0 && (
                <div className="text-muted-foreground mt-0.5 pl-2 border-l border-border">
                  {Object.entries(action.details).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-muted-foreground">{k}:</span> {typeof v === 'string' ? v.substring(0, 60) : JSON.stringify(v).substring(0, 60)}{(typeof v === 'string' ? v.length : JSON.stringify(v).length) > 60 ? '...' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {isAwaitingApproval && onApprove && onReject && (
        <div className="mt-3 pt-3 border-t border-border">
          {!showFeedback ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={onApprove} className="bg-claude-coral hover:bg-claude-coral/90 text-white">
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={handleReviseClick} className="border-border text-muted-foreground">
                Revise
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What changes would you like?"
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim()}
                  className="bg-claude-coral hover:bg-claude-coral/90 text-white"
                >
                  Submit Feedback
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelFeedback} className="border-border text-muted-foreground">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LogEntryItemProps {
  entry: LogEntry;
}

function LogEntryItem({ entry }: LogEntryItemProps) {
  const getIcon = () => {
    switch (entry.type) {
      case 'thinking':
        return <span className="text-muted-foreground">{">"}</span>;
      case 'tool_call':
        return entry.status === 'pending' ? (
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        ) : (
          <span className="text-blue-500">{">"}</span>
        );
      case 'tool_result':
        return entry.status === 'success' ? (
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        ) : (
          <XCircle className="w-3 h-3 text-red-500" />
        );
      case 'reflection':
        return <span className="text-purple-500">{">"}</span>;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'plan':
        return <Clock className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (entry.type) {
      case 'thinking':
        return 'text-muted-foreground';
      case 'tool_call':
        return 'text-blue-600 dark:text-blue-400';
      case 'tool_result':
        return entry.status === 'success'
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';
      case 'reflection':
        return 'text-purple-600 dark:text-purple-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'plan':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="flex items-start gap-2 py-0.5">
      <div className="mt-0.5 flex-shrink-0 w-4 flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1">
        <span className={cn('text-xs leading-relaxed', getTextColor())}>
          {entry.content}
        </span>
        {entry.type === 'tool_call' && entry.toolInput && (
          <div className="text-[10px] text-muted-foreground/70 mt-0.5 pl-2 border-l border-muted">
            {Object.entries(entry.toolInput).slice(0, 3).map(([k, v]) => (
              <div key={k} className="truncate">
                {k}: {typeof v === 'string' ? v.substring(0, 50) : JSON.stringify(v).substring(0, 50)}{(typeof v === 'string' ? v.length : JSON.stringify(v).length) > 50 ? '...' : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentLogProps {
  entries: LogEntry[];
  currentPhase: AgentPhase;
  className?: string;
  defaultExpanded?: boolean;
}

export function AgentLog({
  entries,
  currentPhase,
  className,
  defaultExpanded = false
}: AgentLogProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (entries.length === 0 && currentPhase === 'idle') {
    return null;
  }

  const isProcessing = currentPhase !== 'idle' && currentPhase !== 'complete';

  return (
    <div className={cn('bg-claude-beige rounded-2xl overflow-hidden', className)}>
      {/* Header with steps indicator */}
      <div
        className="flex items-center px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StepsIndicator
          stepCount={entries.length}
          isProcessing={isProcessing}
          isExpanded={isExpanded}
        />
      </div>

      {/* Log entries */}
      {isExpanded && entries.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-black/5 dark:border-white/10 space-y-0.5 max-h-48 overflow-y-auto">
          {entries.map((entry) => (
            <LogEntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to generate unique entry IDs
let entryCounter = 0;
export function createLogEntry(
  type: LogEntry['type'],
  content: string,
  options?: {
    status?: LogEntry['status'];
    toolName?: string;
    toolInput?: Record<string, unknown>;
    planData?: PlanData;
    clarificationData?: ClarificationData;
  }
): LogEntry {
  return {
    id: `entry-${Date.now()}-${++entryCounter}`,
    type,
    content,
    timestamp: new Date(),
    status: options?.status,
    toolName: options?.toolName,
    toolInput: options?.toolInput,
    planData: options?.planData,
    clarificationData: options?.clarificationData,
  };
}
