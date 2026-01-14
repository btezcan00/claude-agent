'use client';

import Link from 'next/link';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Trash2, FolderOpen, User } from 'lucide-react';

interface FolderDetailHeaderProps {
  folder: Folder;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderDetailHeader({
  folder,
  onEdit,
  onDelete,
}: FolderDetailHeaderProps) {
  const { getSignalCountForFolder } = useFolders();
  const signalCount = getSignalCountForFolder(folder.id);

  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <Link
        href="/folders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Folders
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: folder.color ? `${folder.color}20` : 'hsl(var(--muted))',
              color: folder.color || 'hsl(var(--muted-foreground))',
            }}
          >
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{folder.name}</h1>
            <p className="text-sm text-muted-foreground">
              {folder.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>{signalCount} {signalCount === 1 ? 'signal' : 'signals'}</span>
              {folder.ownerName ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {folder.ownerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>Owned by {folder.ownerName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>No owner</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
