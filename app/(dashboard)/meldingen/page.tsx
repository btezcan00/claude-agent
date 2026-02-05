'use client';

import { useState, useEffect } from 'react';
import { useSignals } from '@/context/signal-context';
import { Button } from '@/components/ui/button';
import { SignalFilters } from '@/components/signals/signal-filters';
import { SignalList } from '@/components/signals/signal-list';
import { SignalGrid } from '@/components/signals/signal-grid';
import { SignalSort } from '@/components/signals/signal-sort';
import { SignalCreateDialog } from '@/components/signals/signal-create-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignalsPage() {
  const [mounted, setMounted] = useState(false);
  const { viewMode, setViewMode, filteredSignals, signals } = useSignals();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight">Meldingen</h1>
          <p className="text-muted-foreground">
            Beheer en volg alle actieve onderzoeken
          </p>
        </div>
        <SignalCreateDialog />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <SignalFilters />
        </aside>

        {/* Signals List/Grid */}
        <div className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {filteredSignals.length} van {signals.length} meldingen weergegeven
            </p>
            <div className="flex items-center gap-2">
              <SignalSort />
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

          {/* Signals */}
          {viewMode === 'list' ? <SignalList /> : <SignalGrid />}
        </div>
      </div>
    </div>
  );
}
