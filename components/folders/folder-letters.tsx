'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Mail } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderLettersProps {
  folder: Folder;
}

export function FolderLetters({ folder }: FolderLettersProps) {
  const { addLetter, removeLetter } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Letters"
      icon={Mail}
      items={folder.letters || []}
      onAdd={(item) => addLetter(folder.id, item)}
      onRemove={(itemId) => removeLetter(folder.id, itemId)}
    />
  );
}
