import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ActivityEntry } from '@/types/signal';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/signals/:id/case-relations - Link signal to a case
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const { caseId, relation } = await request.json();

    const signal = store.getSignalById(id);
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Check if case exists
    const caseItem = store.getCaseById(caseId);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check if relation already exists
    if (signal.caseRelations.some(cr => cr.caseId === caseId)) {
      return NextResponse.json(
        { error: 'Signal is already linked to this case' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const activity: ActivityEntry = {
      id: generateId(),
      signalId: id,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'case-added',
      details: 'Added to case',
      timestamp: now,
    };

    const updated = store.updateSignal(id, {
      caseRelations: [...signal.caseRelations, { caseId, relation }],
      updatedAt: now,
      activities: [activity, ...signal.activities],
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to link signal to case' },
      { status: 400 }
    );
  }
}
