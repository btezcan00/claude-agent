'use client';

import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import {
  CASE_TYPES,
  CASE_STATUSES,
  PRIORITY_LEVELS,
  CASE_TYPE_CONFIG,
  CASE_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/constants';
import { CaseType, CaseStatus, PriorityLevel } from '@/types/case';
import { cn } from '@/lib/utils';

export function CaseFilters() {
  const { filters, setFilters, clearFilters } = useCases();
  const { users, getUserFullName } = useUsers();

  const activeFilterCount =
    filters.status.length +
    filters.priority.length +
    filters.type.length +
    filters.assigneeId.length;

  const toggleStatus = (status: CaseStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ status: newStatuses });
  };

  const togglePriority = (priority: PriorityLevel) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    setFilters({ priority: newPriorities });
  };

  const toggleType = (type: CaseType) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type];
    setFilters({ type: newTypes });
  };

  const toggleAssignee = (userId: string) => {
    const newAssignees = filters.assigneeId.includes(userId)
      ? filters.assigneeId.filter((id) => id !== userId)
      : [...filters.assigneeId, userId];
    setFilters({ assigneeId: newAssignees });
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
        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex flex-wrap gap-2">
            {CASE_STATUSES.map((status) => {
              const config = CASE_STATUS_CONFIG[status];
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

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_LEVELS.map((priority) => {
              const config = PRIORITY_CONFIG[priority];
              const isActive = filters.priority.includes(priority);
              return (
                <button
                  key={priority}
                  onClick={() => togglePriority(priority)}
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
          <Label className="text-sm font-medium">Case Type</Label>
          <div className="flex flex-col gap-2">
            {CASE_TYPES.map((type) => {
              const config = CASE_TYPE_CONFIG[type];
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

        {/* Assignee Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Assignee</Label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {users.map((user) => {
              const isActive = filters.assigneeId.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleAssignee(user.id)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-md border transition-all text-left',
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {getUserFullName(user)}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
