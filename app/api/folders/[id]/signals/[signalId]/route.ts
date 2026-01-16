import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ActivityEntry } from '@/types/signal';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string; signalId: string }>;
}

// DELETE /api/folders/:id/signals/:signalId - Unlink a signal from folder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: folderId, signalId } = await params;

  // Check if folder exists
  const folder = store.getFolderById(folderId);
  if (!folder) {
    return NextResponse.json(
      { error: 'Folder not found' },
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

  // Check if signal is linked to folder
  if (!signal.folderRelations.some(fr => fr.folderId === folderId)) {
    return NextResponse.json(
      { error: 'Signal is not linked to this folder' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const activity: ActivityEntry = {
    id: generateId(),
    signalId,
    userId: currentUser.id,
    userName: `${currentUser.firstName} ${currentUser.lastName}`,
    action: 'folder-removed',
    details: 'Removed from folder',
    timestamp: now,
  };

  const updated = store.updateSignal(signalId, {
    folderRelations: signal.folderRelations.filter(fr => fr.folderId !== folderId),
    updatedAt: now,
    activities: [activity, ...signal.activities],
  });

  return NextResponse.json({ success: true, signal: updated });
}
