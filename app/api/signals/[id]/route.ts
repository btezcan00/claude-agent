import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { UpdateSignalInput, ActivityEntry } from '@/types/signal';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/signals/:id - Get a single signal
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const signal = store.getSignalById(id);

  if (!signal) {
    return NextResponse.json(
      { error: 'Signal not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(signal);
}

// PUT /api/signals/:id - Update a signal
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const data: UpdateSignalInput & {
      // Additional fields that can be updated directly
      notes?: unknown[];
      photos?: unknown[];
      attachments?: unknown[];
      indicators?: unknown[];
      caseRelations?: unknown[];
      activities?: unknown[];
    } = await request.json();

    const signal = store.getSignalById(id);
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Build update object
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: now,
    };

    // Add activity entry if not already provided
    if (!data.activities) {
      const activity: ActivityEntry = {
        id: generateId(),
        signalId: id,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        action: 'signal-updated',
        details: 'Signal details updated',
        timestamp: now,
      };
      updateData.activities = [activity, ...signal.activities];
    }

    const updated = store.updateSignal(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update signal' },
      { status: 400 }
    );
  }
}

// DELETE /api/signals/:id - Delete a signal
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const success = store.deleteSignal(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Signal not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
