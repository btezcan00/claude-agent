import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { UpdateCaseInput, Case } from '@/types/case';
import { getServerUserId } from '@/lib/auth-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/dossiers/:id - Get a single dossier
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const caseItem = store.getCaseById(id);

  if (!caseItem) {
    return NextResponse.json(
      { error: 'Dossier niet gevonden' },
      { status: 404 }
    );
  }

  return NextResponse.json(caseItem);
}

// PUT /api/dossiers/:id - Update a dossier
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data: UpdateCaseInput & Partial<Case> = await request.json();

    const caseItem = store.getCaseById(id);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const updated = store.updateCase(id, {
      ...data,
      updatedAt: now,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Dossier bijwerken mislukt' },
      { status: 400 }
    );
  }
}

// DELETE /api/dossiers/:id - Delete a dossier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const success = store.deleteCase(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Dossier niet gevonden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
