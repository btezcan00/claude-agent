'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Lightbulb } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderSuggestionsProps {
  folder: Folder;
}

export function FolderSuggestions({ folder }: FolderSuggestionsProps) {
  const { addSuggestion, removeSuggestion } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Suggestions"
      icon={Lightbulb}
      items={folder.suggestions || []}
      onAdd={(item) => addSuggestion(folder.id, item)}
      onRemove={(itemId) => removeSuggestion(folder.id, itemId)}
    />
  );
}
