import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ActivityEntry } from '@/types/signal';
import { requireAuth } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/signals/:id/case-relations - Link signal to a case
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const user = await requireAuth();
    const { caseId, relation } = await request.json();

    const signal = store.getSignalById(id);
    if (!signal) {
      return NextResponse.json(
        { error: 'Melding niet gevonden' },
        { status: 404 }
      );
    }

    // Check if case exists
    const caseItem = store.getCaseById(caseId);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    // Check if relation already exists
    if (signal.caseRelations.some(cr => cr.caseId === caseId)) {
      return NextResponse.json(
        { error: 'Melding is al gekoppeld aan dit dossier' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const activity: ActivityEntry = {
      id: generateId(),
      signalId: id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'case-added',
      details: 'Aan dossier toegevoegd',
      timestamp: now,
    };

    const updated = store.updateSignal(id, {
      caseRelations: [...signal.caseRelations, { caseId, relation }],
      updatedAt: now,
      activities: [activity, ...signal.activities],
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Melding koppelen aan dossier mislukt' },
      { status: 400 }
    );
  }
}
