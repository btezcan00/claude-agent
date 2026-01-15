'use client';

import { useState, useEffect } from 'react';
import { useFolders } from '@/context/folder-context';
import { FolderKanbanBoard } from '@/components/folders/folder-kanban-board';
import { FolderCreateDialog } from '@/components/folders/folder-create-dialog';
import { StatsCard } from '@/components/common/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FOLDER_STATUSES } from '@/types/folder';
import {
  FolderOpen,
  Kanban,
} from 'lucide-react';

export default function FoldersPage() {
  const [mounted, setMounted] = useState(false);
  const { folders } = useFolders();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats per status
  const getStatusCount = (status: string) => {
    return folders.filter((f) => (f.status || 'application') === status).length;
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-72 h-[500px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Kanban className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          </div>
          <p className="text-muted-foreground">
            Track and manage cases through the Bibob process
          </p>
        </div>
        <FolderCreateDialog />
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-3">
        <StatsCard
          title="Total Cases"
          value={folders.length}
          icon={FolderOpen}
          className="min-w-[140px]"
        />
        {FOLDER_STATUSES.map((status) => (
          <div
            key={status.value}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{ backgroundColor: status.bgColor }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-sm font-medium" style={{ color: status.color }}>
              {status.shortLabel}
            </span>
            <span
              className="text-sm font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${status.color}20`, color: status.color }}
            >
              {getStatusCount(status.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <FolderKanbanBoard />
    </div>
  );
}
