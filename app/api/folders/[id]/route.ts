import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { UpdateFolderInput, Folder } from '@/types/folder';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/folders/:id - Get a single folder
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const folder = store.getFolderById(id);

  if (!folder) {
    return NextResponse.json(
      { error: 'Folder not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(folder);
}

// PUT /api/folders/:id - Update a folder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const data: UpdateFolderInput & Partial<Folder> = await request.json();

    const folder = store.getFolderById(id);
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const updated = store.updateFolder(id, {
      ...data,
      updatedAt: now,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 400 }
    );
  }
}

// DELETE /api/folders/:id - Delete a folder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const success = store.deleteFolder(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Folder not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
