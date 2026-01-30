'use client';

import { Case } from '@/types/case';
import { useSignals } from '@/context/signal-context';
import { CaseSignalCard } from './case-signal-card';
import { Radio } from 'lucide-react';

interface CaseSignalsListProps {
  caseItem: Case;
}

export function CaseSignalsList({ caseItem }: CaseSignalsListProps) {
  const { getSignalsByCaseId, removeSignalFromCase, updateSignalCaseRelation } = useSignals();
  const signals = getSignalsByCaseId(caseItem.id);

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No signals in this case</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add signals to this case by selecting them from the Signals page.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {signals.map((signal) => {
        const caseRelation = signal.caseRelations.find(cr => cr.caseId === caseItem.id);
        return (
          <CaseSignalCard
            key={signal.id}
            signal={signal}
            caseId={caseItem.id}
            relation={caseRelation?.relation}
            onRemove={(signalId) => removeSignalFromCase(signalId, caseItem.id)}
            onRelationChange={(signalId, relation) => updateSignalCaseRelation(signalId, caseItem.id, relation)}
          />
        );
      })}
    </div>
  );
}
