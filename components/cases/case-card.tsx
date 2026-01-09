'use client';

import Link from 'next/link';
import { Case } from '@/types/case';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CaseStatusBadge } from './case-status-badge';
import { CasePriorityBadge } from './case-priority-badge';
import { CaseTypeBadge } from './case-type-badge';
import { formatRelativeTime, isOverdue } from '@/lib/date-utils';
import { Calendar, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseCardProps {
  caseItem: Case;
}

export function CaseCard({ caseItem }: CaseCardProps) {
  const overdue = isOverdue(caseItem.dueDate) && caseItem.status !== 'closed';

  return (
    <Link href={`/cases/${caseItem.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground">
                {caseItem.caseNumber}
              </p>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {caseItem.title}
              </h3>
            </div>
            <CasePriorityBadge priority={caseItem.priority} showIcon={false} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <CaseTypeBadge type={caseItem.type} />
            <CaseStatusBadge status={caseItem.status} />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {caseItem.description}
          </p>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            {caseItem.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{caseItem.location}</span>
              </div>
            )}

            {caseItem.dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  overdue && 'text-destructive'
                )}
              >
                <Calendar className="w-3 h-3" />
                <span>
                  Due {formatRelativeTime(caseItem.dueDate)}
                  {overdue && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            {caseItem.assigneeName ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {caseItem.assigneeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {caseItem.assigneeName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>Unassigned</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(caseItem.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
