'use client';

import { useState } from 'react';
import { Case, FindingItem } from '@/types/case';
import { useCases } from '@/context/case-context';
import { FINDING_TYPES } from '@/data/finding-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, User, UserRound } from 'lucide-react';
import { AddFindingsDialog } from './add-findings-dialog';

interface CaseFindingsProps {
  caseItem: Case;
}

const getSeverityBackground = (severity?: 'none' | 'low' | 'serious' | 'critical'): string => {
  switch (severity) {
    case 'none':
      return 'bg-amber-50';
    case 'low':
      return 'bg-amber-100';
    case 'serious':
      return 'bg-orange-100';
    case 'critical':
      return 'bg-red-100';
    default:
      return 'bg-amber-50';
  }
};

const getSeverityFromLabel = (label: string): 'none' | 'low' | 'serious' | 'critical' | undefined => {
  const findingType = FINDING_TYPES.find(ft => ft.label === label);
  return findingType?.severity;
};

export function CaseFindings({ caseItem }: CaseFindingsProps) {
  const { addFinding, toggleFindingCompletion } = useCases();
  const [dialogOpen, setDialogOpen] = useState(false);

  const items = caseItem.findings || [];

  const handleToggleCompletion = async (findingId: string) => {
    await toggleFindingCompletion(caseItem.id, findingId);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Findings
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings added</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const severity = item.severity ?? getSeverityFromLabel(item.label);
                const bgColor = getSeverityBackground(severity);
                const completedSteps = item.completedSteps ?? 0;
                const totalSteps = item.totalSteps ?? 1;
                const hasAssignedUser = !!item.assignedTo;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${bgColor}`}
                  >
                    <span className="text-sm font-medium text-gray-800 flex-1">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCompletion(item.id)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer px-2 py-1 rounded hover:bg-black/5 transition-colors"
                      >
                        {completedSteps}/{totalSteps}
                      </button>
                      {hasAssignedUser ? (
                        <User className="w-4 h-4 text-gray-600" />
                      ) : (
                        <UserRound className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFindingsDialog
        caseItem={caseItem}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={(item) => addFinding(caseItem.id, item)}
      />
    </>
  );
}
