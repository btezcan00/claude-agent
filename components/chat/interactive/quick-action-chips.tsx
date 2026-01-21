'use client';

import { cn } from '@/lib/utils';
import { QUICK_ACTIONS, QuickAction } from '@/types/chat';

interface QuickActionChipsProps {
  onActionSelect: (prompt: string) => void;
  className?: string;
  disabled?: boolean;
}

export function QuickActionChips({
  onActionSelect,
  className,
  disabled = false,
}: QuickActionChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {QUICK_ACTIONS.map((action) => (
        <QuickActionChip
          key={action.id}
          action={action}
          onClick={() => onActionSelect(action.prompt)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface QuickActionChipProps {
  action: QuickAction;
  onClick: () => void;
  disabled?: boolean;
}

function QuickActionChip({ action, onClick, disabled }: QuickActionChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        'bg-muted/80 hover:bg-muted text-foreground',
        'border border-transparent hover:border-border',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:opacity-50 disabled:pointer-events-none',
        'animate-in fade-in-50 slide-in-from-bottom-2 duration-200'
      )}
      style={{
        animationDelay: `${QUICK_ACTIONS.indexOf(action) * 50}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <span className="text-sm">{action.icon}</span>
      <span>{action.label}</span>
    </button>
  );
}
