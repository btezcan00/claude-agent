import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Signal, CreateSignalInput } from '@/types/signal';
import { requireAuth, getServerUserId } from '@/lib/auth-server';
import { generateId, generateSignalNumber } from '@/lib/utils';

// Validate ISO date strings
const isValidDate = (dateStr: unknown): boolean => {
  if (typeof dateStr !== 'string' || !dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

// GET /api/signals - Get all signals
export async function GET() {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signals = store.getSignals();
  return NextResponse.json(signals);
}

// POST /api/signals - Create a new signal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data: CreateSignalInput = await request.json();
    const now = new Date().toISOString();
    const timeOfObservation = isValidDate(data.timeOfObservation)
      ? data.timeOfObservation
      : now;

    const newSignal: Signal = {
      id: generateId(),
      signalNumber: generateSignalNumber(),
      description: data.description,
      types: data.types,
      placeOfObservation: data.placeOfObservation,
      locationDescription: data.locationDescription,
      timeOfObservation,
      receivedBy: data.receivedBy,
      contactPerson: data.contactPerson,
      createdById: user.id,
      createdByName: `${user.firstName} ${user.lastName}`,
      createdAt: now,
      updatedAt: now,
      caseRelations: (data.caseIds || []).map(caseId => ({ caseId })),
      notes: [],
      activities: [
        {
          id: generateId(),
          signalId: '',
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          action: 'signal-created',
          details: 'Signal created',
          timestamp: now,
        },
      ],
      photos: [],
      attachments: [],
      tags: [],
      indicators: [],
    };
    newSignal.activities[0].signalId = newSignal.id;

    const created = store.createSignal(newSignal);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create signal' },
      { status: 400 }
    );
  }
}
