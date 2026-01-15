'use client';

import { useState } from 'react';
import { Signal, SignalIndicator } from '@/types/signal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus } from 'lucide-react';
import { SignalIndicatorDialog } from './signal-indicator-dialog';
import { getCategoryById, getIndicatorLabel } from '@/lib/indicator-data';

interface SignalIndicatorsProps {
  signal: Signal;
}

export function SignalIndicators({ signal }: SignalIndicatorsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const indicators = signal.indicators || [];
  const indicatorsByCategory = indicators.reduce((acc, indicator) => {
    if (!acc[indicator.categoryId]) {
      acc[indicator.categoryId] = [];
    }
    acc[indicator.categoryId].push(indicator);
    return acc;
  }, {} as Record<string, SignalIndicator[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Indicators ({indicators.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Indicator
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No indicators</p>
            <p className="text-sm">Add indicators to flag potential risks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(indicatorsByCategory).map(([categoryId, indicators]) => {
              const category = getCategoryById(categoryId);
              return (
                <div key={categoryId}>
                  <p className="text-sm font-medium mb-2">{category?.label || categoryId}</p>
                  <div className="flex flex-wrap gap-2">
                    {indicators.map((indicator) => (
                      <Badge
                        key={`${indicator.categoryId}-${indicator.subcategoryId}`}
                        variant="secondary"
                        className="gap-1"
                      >
                        {getIndicatorLabel(indicator.categoryId, indicator.subcategoryId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <SignalIndicatorDialog
        signal={signal}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
}
