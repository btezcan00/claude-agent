import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ActivityEntry } from '@/types/signal';
import { requireAuth } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string; signalId: string }>;
}

// DELETE /api/cases/:id/signals/:signalId - Unlink a signal from case
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: caseId, signalId } = await params;

    // Check if case exists
    const caseItem = store.getCaseById(caseId);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check if signal exists
    const signal = store.getSignalById(signalId);
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Check if signal is linked to case
    if (!signal.caseRelations.some(cr => cr.caseId === caseId)) {
      return NextResponse.json(
        { error: 'Signal is not linked to this case' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'case-removed',
      details: 'Removed from case',
      timestamp: now,
    };

    const updated = store.updateSignal(signalId, {
      caseRelations: signal.caseRelations.filter(cr => cr.caseId !== caseId),
      updatedAt: now,
      activities: [activity, ...signal.activities],
    });

    return NextResponse.json({ success: true, signal: updated });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to unlink signal from case' },
      { status: 400 }
    );
  }
}
