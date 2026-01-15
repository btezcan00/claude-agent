'use client';

import { Folder } from '@/types/folder';
import { useSignals } from '@/context/signal-context';
import { FolderSignalCard } from './folder-signal-card';
import { Radio } from 'lucide-react';

interface FolderSignalsListProps {
  folder: Folder;
}

export function FolderSignalsList({ folder }: FolderSignalsListProps) {
  const { getSignalsByFolderId, removeSignalFromFolder } = useSignals();
  const signals = getSignalsByFolderId(folder.id);

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No signals in this folder</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add signals to this folder by selecting them from the Signals page.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {signals.map((signal) => (
        <FolderSignalCard
          key={signal.id}
          signal={signal}
          folderId={folder.id}
          onRemove={(signalId) => removeSignalFromFolder(signalId, folder.id)}
        />
      ))}
    </div>
  );
}
