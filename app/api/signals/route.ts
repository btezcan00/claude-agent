import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Signal, CreateSignalInput } from '@/types/signal';
import { currentUser } from '@/data/mock-users';
import { generateId, generateSignalNumber } from '@/lib/utils';

// Validate ISO date strings
const isValidDate = (dateStr: unknown): boolean => {
  if (typeof dateStr !== 'string' || !dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

// GET /api/signals - Get all signals
export async function GET() {
  const signals = store.getSignals();
  return NextResponse.json(signals);
}

// POST /api/signals - Create a new signal
export async function POST(request: NextRequest) {
  try {
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
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: now,
      updatedAt: now,
      caseRelations: (data.caseIds || []).map(caseId => ({ caseId })),
      notes: [],
      activities: [
        {
          id: generateId(),
          signalId: '',
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
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
    return NextResponse.json(
      { error: 'Failed to create signal' },
      { status: 400 }
    );
  }
}
