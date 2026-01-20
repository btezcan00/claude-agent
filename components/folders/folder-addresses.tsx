'use client';

import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Home } from 'lucide-react';
import { FolderItemSection } from './folder-item-section';

interface FolderAddressesProps {
  folder: Folder;
}

export function FolderAddresses({ folder }: FolderAddressesProps) {
  const { addAddress, removeAddress } = useFolders();

  return (
    <FolderItemSection
      folder={folder}
      title="Known Addresses"
      icon={Home}
      items={folder.addresses || []}
      onAdd={(item) => addAddress(folder.id, item)}
      onRemove={(itemId) => removeAddress(folder.id, itemId)}
    />
  );
}
