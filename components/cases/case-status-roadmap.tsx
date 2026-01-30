'use client';

import { Case, CASE_STATUSES } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/date-utils';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseStatusRoadmapProps {
  caseItem: Case;
}

export function CaseStatusRoadmap({ caseItem }: CaseStatusRoadmapProps) {
  const currentStatusIndex = CASE_STATUSES.findIndex((s) => s.value === caseItem.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Case Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Roadmap */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(currentStatusIndex / (CASE_STATUSES.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 40px)',
            }}
          />

          {/* Status Steps */}
          <div className="relative flex justify-between">
            {CASE_STATUSES.map((status, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const statusDate = caseItem.statusDates?.[status.value];

              return (
                <div
                  key={status.value}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / CASE_STATUSES.length}%` }}
                >
                  {/* Circle/Checkmark */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {status.shortLabel}
                    </p>
                    {statusDate && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(statusDate)}
                      </p>
                    )}
                    {isCurrent && !statusDate && (
                      <p className="text-[10px] text-primary mt-0.5 font-medium">
                        Current
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status Description */}
        <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: CASE_STATUSES[currentStatusIndex]?.bgColor }}>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CASE_STATUSES[currentStatusIndex]?.color }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: CASE_STATUSES[currentStatusIndex]?.color }}
            >
              {CASE_STATUSES[currentStatusIndex]?.label}
            </span>
          </div>
          {caseItem.statusDates?.[caseItem.status] && (
            <p className="text-xs text-muted-foreground mt-1 ml-5">
              Since {formatDate(caseItem.statusDates[caseItem.status]!)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
