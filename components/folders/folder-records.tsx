'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { FileText } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderRecordsProps {
  folder: Folder;
}

export function FolderRecords({ folder }: FolderRecordsProps) {
  const { addRecord, removeRecord } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Records"
      icon={FileText}
      items={folder.records || []}
      onAdd={(item) => addRecord(folder.id, item)}
      onRemove={(itemId) => removeRecord(folder.id, itemId)}
    />
  );
}
