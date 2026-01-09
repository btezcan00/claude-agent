'use client';

import { useState, useEffect } from 'react';
import { useCases } from '@/context/case-context';
import { Button } from '@/components/ui/button';
import { CaseFilters } from '@/components/cases/case-filters';
import { CaseList } from '@/components/cases/case-list';
import { CaseGrid } from '@/components/cases/case-grid';
import { CaseSort } from '@/components/cases/case-sort';
import { CaseCreateDialog } from '@/components/cases/case-create-dialog';
import { StatsCard } from '@/components/common/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle,
  LayoutGrid,
  List,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CasesPage() {
  const [mounted, setMounted] = useState(false);
  const { viewMode, setViewMode, caseStats, filteredCases } = useCases();

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-2xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground">
            Manage and track all active investigations
          </p>
        </div>
        <CaseCreateDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Cases"
          value={caseStats.total}
          icon={Briefcase}
        />
        <StatsCard
          title="Open"
          value={caseStats.open}
          icon={Clock}
          valueClassName="text-blue-600"
        />
        <StatsCard
          title="In Progress"
          value={caseStats.inProgress}
          icon={Clock}
          valueClassName="text-yellow-600"
        />
        <StatsCard
          title="Closed"
          value={caseStats.closed}
          icon={CheckCircle}
          valueClassName="text-gray-600"
        />
        <StatsCard
          title="Critical"
          value={caseStats.critical}
          icon={AlertCircle}
          valueClassName="text-red-600"
        />
        <StatsCard
          title="Unassigned"
          value={caseStats.unassigned}
          icon={UserX}
          valueClassName="text-orange-600"
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <CaseFilters />
        </aside>

        {/* Cases List/Grid */}
        <div className="flex-1 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCases.length} of {caseStats.total} cases
            </p>
            <div className="flex items-center gap-2">
              <CaseSort />
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

          {/* Cases */}
          {viewMode === 'list' ? <CaseList /> : <CaseGrid />}
        </div>
      </div>
    </div>
  );
}
