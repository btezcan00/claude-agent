'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PushDrawerProps {
  open: boolean;
  width?: number;
  expandedWidth?: number;
  isExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export function PushDrawer({
  open,
  width = 400,
  expandedWidth = 600,
  isExpanded = false,
  children,
  className
}: PushDrawerProps) {
  const currentWidth = isExpanded ? expandedWidth : width;

  return (
    <div
      className={cn(
        'relative h-full bg-card border-l border-border shrink-0',
        'transition-all duration-300 ease-in-out overflow-hidden',
        className
      )}
      style={{ width: open ? `${currentWidth}px` : '0px' }}
    >
      <div className="h-full" style={{ width: `${currentWidth}px` }}>
        {children}
      </div>
    </div>
  );
}
