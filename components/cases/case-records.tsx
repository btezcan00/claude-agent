'use client';

import { Case } from '@/types/case';
import { useCases } from '@/context/case-context';
import { FileText } from 'lucide-react';
import { CaseItemSection } from './case-item-section';

interface CaseRecordsProps {
  caseItem: Case;
}

export function CaseRecords({ caseItem }: CaseRecordsProps) {
  const { addRecord, removeRecord } = useCases();

  return (
    <CaseItemSection
      caseItem={caseItem}
      title="Records"
      icon={FileText}
      items={caseItem.records || []}
      onAdd={(item) => addRecord(caseItem.id, item)}
      onRemove={(itemId) => removeRecord(caseItem.id, itemId)}
    />
  );
}
