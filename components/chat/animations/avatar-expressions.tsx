'use client';

import { cn } from '@/lib/utils';
import { AvatarExpression } from '@/types/chat';

interface AvatarExpressionsProps {
  expression?: AvatarExpression;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ASCII-style faces for different expressions
const EXPRESSIONS: Record<AvatarExpression, { face: string; animation: string }> = {
  neutral: {
    face: '(•‿•)',
    animation: '',
  },
  thinking: {
    face: '(•_•)...',
    animation: 'animate-pulse',
  },
  happy: {
    face: '(◠‿◠)',
    animation: '',
  },
  celebrating: {
    face: '\\(◠‿◠)/',
    animation: 'animate-bounce',
  },
  concerned: {
    face: '(•_•")',
    animation: '',
  },
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function AvatarExpressions({
  expression = 'neutral',
  size = 'md',
  className,
}: AvatarExpressionsProps) {
  const { face, animation } = EXPRESSIONS[expression];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-primary-foreground font-mono',
        SIZE_CLASSES[size],
        animation,
        className
      )}
    >
      <span className="select-none">{face}</span>
    </div>
  );
}

// Animated avatar that transitions between expressions
interface AnimatedAvatarProps {
  expression?: AvatarExpression;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedAvatar({
  expression = 'neutral',
  size = 'md',
  className,
}: AnimatedAvatarProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-mono shadow-lg',
        SIZE_CLASSES[size],
        className
      )}
    >
      {/* Glow effect for celebrating */}
      {expression === 'celebrating' && (
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      )}

      {/* Thinking dots animation */}
      {expression === 'thinking' && (
        <div className="absolute -right-1 -bottom-1 flex gap-0.5">
          <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>
      )}

      <AvatarExpressions expression={expression} size={size} />
    </div>
  );
}

// Simple bot icon variant (non-animated)
export function BotIcon({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-primary-foreground',
        sizeClasses[size],
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn(
          size === 'sm' && 'w-3.5 h-3.5',
          size === 'md' && 'w-4 h-4',
          size === 'lg' && 'w-5 h-5'
        )}
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 12 8 12zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 4c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" />
      </svg>
    </div>
  );
}
