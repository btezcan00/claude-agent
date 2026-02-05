import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getServerUserId } from '@/lib/auth-server';

// GET /api/cases/stats - Get case statistics
export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
