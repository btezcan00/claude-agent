'use client';

import { SignalType } from '@/types/signal';
import { SIGNAL_TYPE_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SignalTypeBadgeProps {
  type: SignalType;
  className?: string;
}

export function SignalTypeBadge({ type, className }: SignalTypeBadgeProps) {
  const config = SIGNAL_TYPE_CONFIG[type];

  if (!config) {
    return (
      <Badge variant="outline" className={cn('bg-gray-100 text-gray-600', className)}>
        {type}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
