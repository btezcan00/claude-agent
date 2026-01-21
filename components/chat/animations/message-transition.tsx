'use client';

import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MessageTransitionProps {
  children: ReactNode;
  isNew?: boolean;
  direction?: 'left' | 'right';
  className?: string;
  delay?: number;
}

export function MessageTransition({
  children,
  isNew = false,
  direction = 'left',
  className,
  delay = 0,
}: MessageTransitionProps) {
  const [isVisible, setIsVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isNew, delay]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isNew && !isVisible && 'opacity-0',
        isNew && !isVisible && direction === 'left' && '-translate-x-4',
        isNew && !isVisible && direction === 'right' && 'translate-x-4',
        isVisible && 'opacity-100 translate-x-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Wrapper for message lists with staggered animation
interface MessageListTransitionProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function MessageListTransition({
  children,
  staggerDelay = 50,
  className,
}: MessageListTransitionProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <MessageTransition key={index} isNew delay={index * staggerDelay}>
          {child}
        </MessageTransition>
      ))}
    </div>
  );
}
