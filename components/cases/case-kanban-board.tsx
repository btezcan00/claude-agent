'use client';

import { useMemo } from 'react';
import { useCases } from '@/context/case-context';
import { Case, CaseStatus, CASE_STATUSES } from '@/types/case';
import { CaseKanbanCard } from './case-kanban-card';
import { cn } from '@/lib/utils';

export function CaseKanbanBoard() {
  const { filteredCases } = useCases();

  // Group cases by status
  const casesByStatus = useMemo(() => {
    const grouped: Record<CaseStatus, Case[]> = {
      application: [],
      research: [],
      national_office: [],
      decision: [],
      archive: [],
    };

    filteredCases.forEach((caseItem) => {
      const status = caseItem.status || 'application';
      if (grouped[status]) {
        grouped[status].push(caseItem);
      }
    });

    return grouped;
  }, [filteredCases]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {CASE_STATUSES.map((status) => {
        const cases = casesByStatus[status.value];
        const count = cases.length;

        return (
          <div
            key={status.value}
            className="flex-1 min-w-[180px] max-w-[320px]"
          >
            {/* Column Header */}
            <div
              className="p-3 rounded-t-lg border border-b-0"
              style={{ backgroundColor: status.bgColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-semibold text-sm" style={{ color: status.color }}>
                    {status.shortLabel}
                  </h3>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                >
                  {count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {status.label}
              </p>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                'border border-t-0 rounded-b-lg p-2 min-h-[400px] space-y-2',
                'bg-muted/30'
              )}
            >
              {cases.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No cases
                </div>
              ) : (
                cases.map((caseItem) => (
                  <CaseKanbanCard key={caseItem.id} caseItem={caseItem} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
