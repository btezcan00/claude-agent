'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Activity } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderActivitiesProps {
  folder: Folder;
}

export function FolderActivities({ folder }: FolderActivitiesProps) {
  const { addActivity, removeActivity } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Activities"
      icon={Activity}
      items={folder.activities || []}
      onAdd={(item) => addActivity(folder.id, item)}
      onRemove={(itemId) => removeActivity(folder.id, itemId)}
    />
  );
}
