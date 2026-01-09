'use client';

import { CaseStatus } from '@/types/case';
import { CASE_STATUS_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = CASE_STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
