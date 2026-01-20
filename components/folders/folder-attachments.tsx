'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Paperclip } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderAttachmentsProps {
  folder: Folder;
}

export function FolderAttachments({ folder }: FolderAttachmentsProps) {
  const { addAttachment, removeAttachment } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Attachments"
      icon={Paperclip}
      items={folder.attachments || []}
      onAdd={(item) => addAttachment(folder.id, item)}
      onRemove={(itemId) => removeAttachment(folder.id, itemId)}
    />
  );
}
