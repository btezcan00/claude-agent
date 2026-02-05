'use client';

import { useSignals } from '@/context/signal-context';
import { useCases } from '@/context/case-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Briefcase } from 'lucide-react';
import {
  SIGNAL_TYPES,
  SIGNAL_SOURCES,
  SIGNAL_TYPE_CONFIG,
  SIGNAL_SOURCE_CONFIG,
} from '@/lib/constants';
import { SignalType, SignalSource } from '@/types/signal';
import { cn } from '@/lib/utils';

export function SignalFilters() {
  const { filters, setFilters, clearFilters } = useSignals();
  const { cases } = useCases();

  const activeFilterCount =
    filters.type.length +
    filters.receivedBy.length +
    filters.caseId.length;

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

  const toggleCase = (caseId: string) => {
    const newCases = filters.caseId.includes(caseId)
      ? filters.caseId.filter((id) => id !== caseId)
      : [...filters.caseId, caseId];
    setFilters({ caseId: newCases });
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
              Wissen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Case Filter */}
        {cases.length > 0 && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                Dossiers
              </Label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {cases.map((caseItem) => {
                  const isActive = filters.caseId.includes(caseItem.id);
                  return (
                    <button
                      key={caseItem.id}
                      onClick={() => toggleCase(caseItem.id)}
                      className={cn(
                        'px-3 py-2 text-xs font-medium rounded-md border transition-all text-left flex items-center gap-2',
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {caseItem.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: caseItem.color }}
                        />
                      )}
                      {caseItem.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Meldingtype</Label>
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
          <Label className="text-sm font-medium">Meldingbron</Label>
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
