'use client';

import { cn } from '@/lib/utils';
import { getWaitingMessage } from '../personality/personality-config';
import { AvatarExpressions } from './avatar-expressions';

interface AnimatedTypingProps {
  showAvatar?: boolean;
  showMessage?: boolean;
  className?: string;
}

export function AnimatedTyping({
  showAvatar = true,
  showMessage = true,
  className,
}: AnimatedTypingProps) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      {showAvatar && (
        <AvatarExpressions expression="thinking" size="sm" />
      )}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 bg-muted rounded-lg px-3 py-2">
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        {showMessage && (
          <p className="text-xs text-muted-foreground px-1 animate-pulse">
            {getWaitingMessage()}
          </p>
        )}
      </div>
    </div>
  );
}

// Simple dot loader variant
export function DotLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
