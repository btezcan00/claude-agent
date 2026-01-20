'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { BarChart3 } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderVisualizationsProps {
  folder: Folder;
}

export function FolderVisualizations({ folder }: FolderVisualizationsProps) {
  const { addVisualization, removeVisualization } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Visualizations"
      icon={BarChart3}
      items={folder.visualizations || []}
      onAdd={(item) => addVisualization(folder.id, item)}
      onRemove={(itemId) => removeVisualization(folder.id, itemId)}
    />
  );
}
