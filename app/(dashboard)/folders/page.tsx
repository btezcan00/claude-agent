'use client';

import { useState, useEffect } from 'react';
import { useFolders } from '@/context/folder-context';
import { Button } from '@/components/ui/button';
import { FolderFilters } from '@/components/folders/folder-filters';
import { FolderList } from '@/components/folders/folder-list';
import { FolderGrid } from '@/components/folders/folder-grid';
import { FolderCreateDialog } from '@/components/folders/folder-create-dialog';
import { StatsCard } from '@/components/common/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  LayoutGrid,
  List,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FoldersPage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const { folders, filteredFolders } = useFolders();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats
  const totalFolders = folders.length;
  const ownedFolders = folders.filter((f) => f.ownerId !== null).length;
  const unownedFolders = folders.filter((f) => f.ownerId === null).length;

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <Skeleton className="w-full lg:w-64 h-96" />
          <div className="flex-1">
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folders</h1>
          <p className="text-muted-foreground">
            Organize and group signals into folders
          </p>
        </div>
        <FolderCreateDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Folders"
          value={totalFolders}
          icon={FolderOpen}
        />
        <StatsCard
          title="Owned"
          value={ownedFolders}
          icon={User}
          valueClassName="text-blue-600"
        />
        <StatsCard
          title="Unowned"
          value={unownedFolders}
          icon={Users}
          valueClassName="text-gray-600"
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <FolderFilters />
        </aside>

        {/* Folders List/Grid */}
        <div className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredFolders.length} of {totalFolders} folders
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    viewMode === 'list' && 'bg-muted'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    viewMode === 'grid' && 'bg-muted'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Folders */}
          {viewMode === 'list' ? <FolderList /> : <FolderGrid />}
        </div>
      </div>
    </div>
  );
}
