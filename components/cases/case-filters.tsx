'use client';

import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CaseFilters() {
  const { filters, setFilters, clearFilters } = useCases();
  const { users, getUserFullName } = useUsers();

  const activeFilterCount = filters.ownerId.length;

  const toggleOwner = (userId: string) => {
    const newOwners = filters.ownerId.includes(userId)
      ? filters.ownerId.filter((id) => id !== userId)
      : [...filters.ownerId, userId];
    setFilters({ ownerId: newOwners });
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
        {/* Owner Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Owner</Label>
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
            {users.map((user) => {
              const isActive = filters.ownerId.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleOwner(user.id)}
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
