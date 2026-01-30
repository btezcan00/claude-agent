import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { UpdateCaseInput, Case } from '@/types/case';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cases/:id - Get a single case
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const caseItem = store.getCaseById(id);

  if (!caseItem) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(caseItem);
}

// PUT /api/cases/:id - Update a case
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const data: UpdateCaseInput & Partial<Case> = await request.json();

    const caseItem = store.getCaseById(id);
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
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
      { error: 'Failed to update case' },
      { status: 400 }
    );
  }
}

// DELETE /api/cases/:id - Delete a case
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const success = store.deleteCase(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Case not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
