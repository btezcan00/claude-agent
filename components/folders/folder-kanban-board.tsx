'use client';

import { useMemo } from 'react';
import { useFolders } from '@/context/folder-context';
import { Folder, FolderStatus, FOLDER_STATUSES } from '@/types/folder';
import { FolderKanbanCard } from './folder-kanban-card';
import { cn } from '@/lib/utils';

export function FolderKanbanBoard() {
  const { filteredFolders } = useFolders();

  // Group folders by status
  const foldersByStatus = useMemo(() => {
    const grouped: Record<FolderStatus, Folder[]> = {
      application: [],
      research: [],
      national_office: [],
      decision: [],
      archive: [],
    };

    filteredFolders.forEach((folder) => {
      const status = folder.status || 'application';
      if (grouped[status]) {
        grouped[status].push(folder);
      }
    });

    return grouped;
  }, [filteredFolders]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {FOLDER_STATUSES.map((status) => {
        const folders = foldersByStatus[status.value];
        const count = folders.length;

        return (
          <div
            key={status.value}
            className="flex-shrink-0 w-72"
          >
            {/* Column Header */}
            <div
              className="p-3 rounded-t-lg border border-b-0"
              style={{ backgroundColor: status.bgColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-semibold text-sm" style={{ color: status.color }}>
                    {status.shortLabel}
                  </h3>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                >
                  {count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {status.label}
              </p>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                'border border-t-0 rounded-b-lg p-2 min-h-[400px] space-y-2',
                'bg-muted/30'
              )}
            >
              {folders.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                  No folders
                </div>
              ) : (
                folders.map((folder) => (
                  <FolderKanbanCard key={folder.id} folder={folder} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
