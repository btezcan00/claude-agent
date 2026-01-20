'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { MessageSquare } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderCommunicationsProps {
  folder: Folder;
}

export function FolderCommunications({ folder }: FolderCommunicationsProps) {
  const { addCommunication, removeCommunication } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Communications"
      icon={MessageSquare}
      items={folder.communications || []}
      onAdd={(item) => addCommunication(folder.id, item)}
      onRemove={(itemId) => removeCommunication(folder.id, itemId)}
    />
  );
}
