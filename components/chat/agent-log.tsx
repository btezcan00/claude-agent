'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export type AgentPhase = 'idle' | 'planning' | 'awaiting_approval' | 'executing' | 'reflecting' | 'complete';

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

export interface LogEntry {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'reflection' | 'error' | 'plan';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  toolName?: string;
  toolInput?: Record<string, unknown>;
  planData?: PlanData;
}

interface PhaseIndicatorProps {
  phase: AgentPhase;
}

function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const phases: { key: AgentPhase; label: string }[] = [
    { key: 'planning', label: 'Plan' },
    { key: 'awaiting_approval', label: 'Approve' },
    { key: 'executing', label: 'Execute' },
    { key: 'reflecting', label: 'Reflect' },
    { key: 'complete', label: 'Done' },
  ];

  if (phase === 'idle') return null;

  return (
    <div className="flex items-center gap-1.5">
      {phases.map((p, i) => {
        const isActive = p.key === phase;
        const isPast = phases.findIndex(x => x.key === phase) > i;
        const isComplete = phase === 'complete';

        return (
          <div key={p.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                isActive && !isComplete && 'bg-primary/20 text-primary',
                isPast && 'bg-muted text-muted-foreground',
                isComplete && p.key === 'complete' && 'bg-green-500/20 text-green-600',
                !isActive && !isPast && !isComplete && 'text-muted-foreground/50'
              )}
            >
              {isActive && !isComplete && (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              )}
              {(isPast || (isComplete && p.key !== 'complete')) && (
                <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
              )}
              {isComplete && p.key === 'complete' && (
                <CheckCircle2 className="w-2.5 h-2.5" />
              )}
              {p.label}
            </div>
            {i < phases.length - 1 && (
              <div
                className={cn(
                  'w-3 h-px',
                  isPast || (isActive && i < phases.findIndex(x => x.key === phase))
                    ? 'bg-green-500'
                    : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PlanDisplayProps {
  plan: PlanData;
  onApprove?: () => void;
  onReject?: () => void;
  isAwaitingApproval?: boolean;
}

export function PlanDisplay({ plan, onApprove, onReject, isAwaitingApproval }: PlanDisplayProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
        <Clock className="w-4 h-4" />
        Proposed Plan
      </div>
      <div className="text-xs text-blue-800 dark:text-blue-200 mb-3">
        {plan.summary}
      </div>
      <div className="space-y-2">
        {plan.actions.map((action) => (
          <div key={action.step} className="flex items-start gap-2 text-xs">
            <span className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
              {action.step}
            </span>
            <div className="flex-1">
              <span className="font-medium">{action.action}</span>
              <span className="text-blue-500 dark:text-blue-400 ml-1">({action.tool})</span>
              {action.details && Object.keys(action.details).length > 0 && (
                <div className="text-blue-600 dark:text-blue-400 mt-0.5 pl-2 border-l border-blue-300 dark:border-blue-700">
                  {Object.entries(action.details).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-blue-500">{k}:</span> {typeof v === 'string' ? v.substring(0, 60) : JSON.stringify(v).substring(0, 60)}{(typeof v === 'string' ? v.length : JSON.stringify(v).length) > 60 ? '...' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {isAwaitingApproval && onApprove && onReject && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <Button size="sm" onClick={onApprove} className="bg-blue-600 hover:bg-blue-700">
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
            Revise
          </Button>
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
  defaultExpanded = true
}: AgentLogProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (entries.length === 0 && currentPhase === 'idle') {
    return null;
  }

  return (
    <div className={cn('bg-muted/50 rounded-lg border border-border overflow-hidden', className)}>
      {/* Header with phase indicator and collapse toggle */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <PhaseIndicator phase={currentPhase} />
        <button className="p-0.5 hover:bg-muted rounded">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Log entries */}
      {isExpanded && entries.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-0.5 max-h-48 overflow-y-auto">
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
  };
}
