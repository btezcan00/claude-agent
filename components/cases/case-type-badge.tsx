'use client';

import { CaseType } from '@/types/case';
import { CASE_TYPE_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CaseTypeBadgeProps {
  type: CaseType;
  className?: string;
}

export function CaseTypeBadge({ type, className }: CaseTypeBadgeProps) {
  const config = CASE_TYPE_CONFIG[type];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
