'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Search } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderFindingsProps {
  folder: Folder;
}

export function FolderFindings({ folder }: FolderFindingsProps) {
  const { addFinding, removeFinding } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Findings"
      icon={Search}
      items={folder.findings || []}
      onAdd={(item) => addFinding(folder.id, item)}
      onRemove={(itemId) => removeFinding(folder.id, itemId)}
    />
  );
}
