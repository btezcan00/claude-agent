'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Case, CASE_STATUSES } from '@/types/case';
import { useCases } from '@/context/case-context';
import { useUIHighlight } from '@/context/ui-highlight-context';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/lib/date-utils';
import { FolderOpen, User, Radio } from 'lucide-react';
import { CaseApplicationDialog } from './case-application-dialog';

interface CaseKanbanCardProps {
  caseItem: Case;
}

export function CaseKanbanCard({ caseItem }: CaseKanbanCardProps) {
  const router = useRouter();
  const { getSignalCountForCase } = useCases();
  const { isHighlighted } = useUIHighlight();
  const signalCount = getSignalCountForCase(caseItem.id);
  const highlighted = isHighlighted('case', caseItem.id);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);

  const currentStatusConfig = CASE_STATUSES.find((s) => s.value === caseItem.status);
  const currentStatusDate = caseItem.statusDates?.[caseItem.status];

  const isApplicationStatus = caseItem.status === 'application';

  const handleCardClick = () => {
    if (isApplicationStatus) {
      setApplicationDialogOpen(true);
    }
  };

  const handleStartResearch = () => {
    setApplicationDialogOpen(false);
    router.push(`/cases/${caseItem.id}`);
  };

  const cardContent = (
    <Card
      className={cn(
        "p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4",
        highlighted && "animate-ui-highlight"
      )}
      style={{ borderLeftColor: caseItem.color || 'transparent' }}
      onClick={isApplicationStatus ? handleCardClick : undefined}
    >
        <div className="space-y-2">
          {/* Header with case name */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{
                backgroundColor: caseItem.color ? `${caseItem.color}20` : 'hsl(var(--muted))',
                color: caseItem.color || 'hsl(var(--muted-foreground))',
              }}
            >
              <FolderOpen className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {caseItem.name}
            </h3>
          </div>

          {/* Signals count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Radio className="w-3 h-3" />
            <span>{signalCount} {signalCount === 1 ? 'signal' : 'signals'}</span>
          </div>

          {/* Status date */}
          {currentStatusDate && (
            <div className="text-xs text-muted-foreground">
              In {currentStatusConfig?.shortLabel} since {formatDate(currentStatusDate)}
            </div>
          )}

          {/* Footer with owner */}
          <div className="flex items-center justify-between pt-2 border-t">
            {caseItem.ownerName ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {caseItem.ownerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {caseItem.ownerName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>No owner</span>
              </div>
            )}
          </div>
        </div>
      </Card>
  );

  return (
    <>
      {isApplicationStatus ? (
        cardContent
      ) : (
        <Link href={`/cases/${caseItem.id}`}>
          {cardContent}
        </Link>
      )}

      <CaseApplicationDialog
        caseItem={caseItem}
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onStartResearch={handleStartResearch}
      />
    </>
  );
}
