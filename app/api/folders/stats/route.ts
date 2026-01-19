import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/folders/stats - Get folder statistics
export async function GET() {
  const folders = store.getFolders();
  const signals = store.getSignals();

  const foldersWithSignals = folders.filter((f) =>
    signals.some((s) => s.folderRelations.some(fr => fr.folderId === f.id))
  );

  const stats = {
    total: folders.length,
    withSignals: foldersWithSignals.length,
    empty: folders.length - foldersWithSignals.length,
  };

  return NextResponse.json(stats);
}
