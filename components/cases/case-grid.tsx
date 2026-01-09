'use client';

import { useCases } from '@/context/case-context';
import { CaseCard } from './case-card';
import { Briefcase } from 'lucide-react';

export function CaseGrid() {
  const { filteredCases } = useCases();

  if (filteredCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No cases found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your search or filter criteria to find what you&apos;re
          looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredCases.map((caseItem) => (
        <CaseCard key={caseItem.id} caseItem={caseItem} />
      ))}
    </div>
  );
}
