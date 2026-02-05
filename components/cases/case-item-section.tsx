'use client';

import { useState } from 'react';
import { Case, CaseItem, CASE_STATUSES, CaseStatus } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, LucideIcon } from 'lucide-react';
import { AddItemDialog } from './add-item-dialog';

interface CaseItemSectionProps {
  caseItem: Case;
  title: string;
  icon: LucideIcon;
  items: CaseItem[];
  onAdd: (item: Omit<CaseItem, 'id'>) => void;
  onRemove: (itemId: string) => void;
}

export function CaseItemSection({
  caseItem,
  title,
  icon: Icon,
  items,
  onAdd,
  onRemove,
}: CaseItemSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getPhaseLabel = (phase: string) => {
    const status = CASE_STATUSES.find((s) => s.value === phase);
    return status?.label || phase;
  };

  const getPhaseColor = (phase: string) => {
    const status = CASE_STATUSES.find((s) => s.value === phase);
    return status?.color || '#6b7280';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {title}
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen {title.toLowerCase()} toegevoegd</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.label}</span>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getPhaseColor(item.phase),
                            color: getPhaseColor(item.phase),
                          }}
                          className="text-xs"
                        >
                          {getPhaseLabel(item.phase)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={onAdd}
        currentPhase={caseItem.status}
        title={`${title.replace(/s$/, '')} Toevoegen`}
      />
    </>
  );
}
