'use client';

import { PriorityLevel } from '@/types/case';
import { PRIORITY_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Minus, AlertCircle } from 'lucide-react';

interface CasePriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  critical: AlertCircle,
};

export function CasePriorityBadge({
  priority,
  className,
  showIcon = true,
}: CasePriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = iconMap[priority];

  return (
    <Badge variant={config.variant} className={cn(config.className, 'gap-1', className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}
