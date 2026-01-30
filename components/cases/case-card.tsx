'use client';

import Link from 'next/link';
import { Case } from '@/types/case';
import { useCases } from '@/context/case-context';
import { useUIHighlight } from '@/context/ui-highlight-context';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/date-utils';
import { FolderOpen, User, Radio } from 'lucide-react';

interface CaseCardProps {
  caseItem: Case;
}

export function CaseCard({ caseItem }: CaseCardProps) {
  const { getSignalCountForCase } = useCases();
  const { isHighlighted } = useUIHighlight();
  const signalCount = getSignalCountForCase(caseItem.id);
  const highlighted = isHighlighted('case', caseItem.id);

  return (
    <Link href={`/cases/${caseItem.id}`}>
      <Card className={cn(
        "h-full hover:shadow-md transition-shadow cursor-pointer border-l-4",
        highlighted && "animate-ui-highlight"
      )}
        style={{ borderLeftColor: caseItem.color || 'transparent' }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: caseItem.color ? `${caseItem.color}20` : 'hsl(var(--muted))',
                  color: caseItem.color || 'hsl(var(--muted-foreground))',
                }}
              >
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                  {caseItem.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {signalCount} {signalCount === 1 ? 'signal' : 'signals'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {caseItem.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t">
            {caseItem.ownerName ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {caseItem.ownerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {caseItem.ownerName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>No owner</span>
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
