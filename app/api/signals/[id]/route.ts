import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { UpdateSignalInput, ActivityEntry } from '@/types/signal';
import { requireAuth, getServerUserId } from '@/lib/auth-server';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/signals/:id - Get a single signal
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const signal = store.getSignalById(id);

  if (!signal) {
    return NextResponse.json(
      { error: 'Melding niet gevonden' },
      { status: 404 }
    );
  }

  return NextResponse.json(signal);
}

// PUT /api/signals/:id - Update a signal
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const user = await requireAuth();
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
        { error: 'Melding niet gevonden' },
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
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: 'signal-updated',
        details: 'Meldingdetails bijgewerkt',
        timestamp: now,
      };
      updateData.activities = [activity, ...signal.activities];
    }

    const updated = store.updateSignal(id, updateData);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'User not found')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Melding bijwerken mislukt' },
      { status: 400 }
    );
  }
}

// DELETE /api/signals/:id - Delete a signal
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const success = store.deleteSignal(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Melding niet gevonden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
