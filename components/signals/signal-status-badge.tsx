'use client';

import { SignalStatus } from '@/types/signal';
import { SIGNAL_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SignalStatusBadgeProps {
  status: SignalStatus;
  className?: string;
}

export function SignalStatusBadge({ status, className }: SignalStatusBadgeProps) {
  const config = SIGNAL_STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
