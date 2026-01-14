'use client';

import { useSignals } from '@/context/signal-context';
import { useFolders } from '@/context/folder-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Filter, FolderOpen } from 'lucide-react';
import {
  SIGNAL_TYPES,
  SIGNAL_STATUSES,
  SIGNAL_SOURCES,
  SIGNAL_TYPE_CONFIG,
  SIGNAL_STATUS_CONFIG,
  SIGNAL_SOURCE_CONFIG,
} from '@/lib/constants';
import { SignalType, SignalStatus, SignalSource } from '@/types/signal';
import { cn } from '@/lib/utils';

export function SignalFilters() {
  const { filters, setFilters, clearFilters } = useSignals();
  const { folders } = useFolders();

  const activeFilterCount =
    filters.status.length +
    filters.type.length +
    filters.receivedBy.length +
    filters.folderId.length;

  const toggleStatus = (status: SignalStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ status: newStatuses });
  };

  const toggleType = (type: SignalType) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type];
    setFilters({ type: newTypes });
  };

  const toggleSource = (source: SignalSource) => {
    const newSources = filters.receivedBy.includes(source)
      ? filters.receivedBy.filter((s) => s !== source)
      : [...filters.receivedBy, source];
    setFilters({ receivedBy: newSources });
  };

  const toggleFolder = (folderId: string) => {
    const newFolders = filters.folderId.includes(folderId)
      ? filters.folderId.filter((id) => id !== folderId)
      : [...filters.folderId, folderId];
    setFilters({ folderId: newFolders });
  };

  return (
    <Card className="sticky top-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Folder Filter */}
        {folders.length > 0 && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                Folders
              </Label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {folders.map((folder) => {
                  const isActive = filters.folderId.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        'px-3 py-2 text-xs font-medium rounded-md border transition-all text-left flex items-center gap-2',
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {folder.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: folder.color }}
                        />
                      )}
                      {folder.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex flex-wrap gap-2">
            {SIGNAL_STATUSES.map((status) => {
              const config = SIGNAL_STATUS_CONFIG[status];
              const isActive = filters.status.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md border transition-all',
                    isActive
                      ? config.className
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Signal Type</Label>
          <div className="flex flex-col gap-2">
            {SIGNAL_TYPES.map((type) => {
              const config = SIGNAL_TYPE_CONFIG[type];
              const isActive = filters.type.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-md border transition-all text-left',
                    isActive
                      ? config.className
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Source Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Signal Source</Label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {SIGNAL_SOURCES.map((source) => {
              const config = SIGNAL_SOURCE_CONFIG[source];
              const isActive = filters.receivedBy.includes(source);
              return (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-md border transition-all text-left',
                    isActive
                      ? config.className
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
