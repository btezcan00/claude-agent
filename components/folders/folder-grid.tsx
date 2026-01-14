'use client';

import { useFolders } from '@/context/folder-context';
import { FolderCard } from './folder-card';
import { FolderOpen } from 'lucide-react';

export function FolderGrid() {
  const { filteredFolders } = useFolders();

  if (filteredFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No folders found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create a folder to organize your signals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredFolders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}
    </div>
  );
}
