'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Users } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderPeopleInvolvedProps {
  folder: Folder;
}

export function FolderPeopleInvolved({ folder }: FolderPeopleInvolvedProps) {
  const { addPersonInvolved, removePersonInvolved } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="People Involved"
      icon={Users}
      items={folder.peopleInvolved || []}
      onAdd={(item) => addPersonInvolved(folder.id, item)}
      onRemove={(itemId) => removePersonInvolved(folder.id, itemId)}
    />
  );
}
