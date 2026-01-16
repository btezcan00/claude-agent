import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ActivityEntry } from '@/types/signal';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/signals/:id/folder-relations - Link signal to a folder
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const { folderId, relation } = await request.json();

    const signal = store.getSignalById(id);
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Check if folder exists
    const folder = store.getFolderById(folderId);
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check if relation already exists
    if (signal.folderRelations.some(fr => fr.folderId === folderId)) {
      return NextResponse.json(
        { error: 'Signal is already linked to this folder' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const activity: ActivityEntry = {
      id: generateId(),
      signalId: id,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'folder-added',
      details: 'Added to folder',
      timestamp: now,
    };

    const updated = store.updateSignal(id, {
      folderRelations: [...signal.folderRelations, { folderId, relation }],
      updatedAt: now,
      activities: [activity, ...signal.activities],
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to link signal to folder' },
      { status: 400 }
    );
  }
}
