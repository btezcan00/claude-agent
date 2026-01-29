'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PushDrawerProps {
  open: boolean;
  width?: number;
  children: ReactNode;
  className?: string;
}

export function PushDrawer({ open, width = 400, children, className }: PushDrawerProps) {
  return (
    <div
      className={cn(
        'h-full bg-card border-l border-border shrink-0',
        'transition-all duration-300 ease-in-out overflow-hidden',
        className
      )}
      style={{ width: open ? `${width}px` : '0px' }}
    >
      <div className="h-full" style={{ width: `${width}px` }}>
        {children}
      </div>
    </div>
  );
}
