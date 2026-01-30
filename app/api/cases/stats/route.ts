import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/cases/stats - Get case statistics
export async function GET() {
  const cases = store.getCases();
  const signals = store.getSignals();

  const casesWithSignals = cases.filter((c) =>
    signals.some((s) => s.caseRelations.some(cr => cr.caseId === c.id))
  );

  const stats = {
    total: cases.length,
    withSignals: casesWithSignals.length,
    empty: cases.length - casesWithSignals.length,
  };

  return NextResponse.json(stats);
}
