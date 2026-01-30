'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, ChevronRight, Clock, Sparkles, Brain } from 'lucide-react';
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
    <div className="bg-claude-beige rounded-xl p-4 border border-border/50 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
        <Clock className="w-4 h-4 text-claude-coral" />
        Proposed Plan
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        {plan.summary}
      </p>
      <div className="space-y-2">
        {plan.actions.map((action) => (
          <div key={action.step} className="bg-white/60 dark:bg-black/10 rounded-lg p-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="bg-claude-coral/10 text-claude-coral rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold">
                {action.step}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="font-medium text-foreground break-words">{action.action}</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">{action.tool}</div>
              </div>
            </div>
            {action.details && Object.keys(action.details).length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/30 ml-9 space-y-1">
                {Object.entries(action.details).map(([k, v]) => (
                  <div key={k} className="text-[11px] break-words">
                    <span className="text-muted-foreground font-medium">{k}:</span>{' '}
                    <span className="text-foreground/80">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAwaitingApproval && onApprove && onReject && (
        <div className="mt-4 pt-3 border-t border-border/30">
          {!showFeedback ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={onApprove} className="bg-claude-coral hover:bg-claude-coral/90 text-white font-medium px-4">
                Approve Plan
              </Button>
              <Button size="sm" variant="outline" onClick={handleReviseClick} className="border-border/50 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5">
                Request Changes
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
        return <Brain className="w-3 h-3 text-claude-coral" />;
      case 'tool_call':
        return entry.status === 'pending' ? (
          <Loader2 className="w-3 h-3 animate-spin text-claude-coral" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-claude-coral" />
        );
      case 'tool_result':
        return entry.status === 'success' ? (
          <CheckCircle2 className="w-3 h-3 text-claude-coral" />
        ) : (
          <XCircle className="w-3 h-3 text-claude-coral" />
        );
      case 'reflection':
        return <Sparkles className="w-3 h-3 text-claude-coral" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-claude-coral" />;
      case 'plan':
        return <Clock className="w-3 h-3 text-claude-coral" />;
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (entry.type) {
      case 'thinking':
        return 'text-foreground/80';
      case 'tool_call':
        return 'text-foreground';
      case 'tool_result':
        return 'text-foreground';
      case 'reflection':
        return 'text-foreground/80';
      case 'error':
        return 'text-foreground';
      case 'plan':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  // Special rendering for thinking entries
  if (entry.type === 'thinking') {
    return (
      <div className="flex items-start gap-2 py-1 px-2 bg-claude-coral/5 rounded-lg my-0.5">
        <div className="mt-0.5 flex-shrink-0 w-4 flex items-center justify-center">
          {getIcon()}
        </div>
        <div className="flex-1">
          <span className="text-xs leading-relaxed text-foreground/80 italic">
            {entry.content}
          </span>
        </div>
      </div>
    );
  }

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
          <div className="text-[10px] text-muted-foreground/70 mt-0.5 pl-2 border-l border-claude-coral/30">
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
