'use client';

import { useState, useEffect } from 'react';
import { Signal, SignalIndicator } from '@/types/signal';
import { useSignals } from '@/context/signal-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INDICATOR_CATEGORIES } from '@/lib/indicator-data';

interface SignalIndicatorDialogProps {
  signal: Signal;
  open: boolean;
  onClose: () => void;
}

export function SignalIndicatorDialog({ signal, open, onClose }: SignalIndicatorDialogProps) {
  const { updateIndicators } = useSignals();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      const indicators = signal.indicators || [];
      const initialSelected = new Set(
        indicators.map(ind => `${ind.categoryId}-${ind.subcategoryId}`)
      );
      setSelectedIndicators(initialSelected);

      const categoriesWithSelections = new Set(indicators.map(ind => ind.categoryId));
      setExpandedCategories(categoriesWithSelections);
    }
  }, [open, signal.indicators]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleIndicator = (categoryId: string, subcategoryId: string) => {
    const key = `${categoryId}-${subcategoryId}`;
    setSelectedIndicators(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = () => {
    const indicators: SignalIndicator[] = Array.from(selectedIndicators).map(key => {
      const [categoryId, ...rest] = key.split('-');
      const subcategoryId = rest.join('-');
      return { categoryId, subcategoryId };
    });

    updateIndicators(signal.id, indicators);
    onClose();
  };

  const getSelectedCountForCategory = (categoryId: string): number => {
    return Array.from(selectedIndicators).filter(key => key.startsWith(`${categoryId}-`)).length;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Indicators</DialogTitle>
          <DialogDescription>
            Select indicators that apply to this signal. Click a category to expand and see subcategories.
          </DialogDescription>
        </DialogHeader>

        <div className="h-[400px] overflow-y-auto pr-4">
          <div className="space-y-2">
            {INDICATOR_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const selectedCount = getSelectedCountForCategory(category.id);

              return (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 text-left transition-colors',
                      'hover:bg-muted/50',
                      isExpanded && 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">{category.label}</span>
                      {selectedCount > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category.subcategories.length} options
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/10 p-3 space-y-2">
                      {category.subcategories.map((subcategory) => {
                        const key = `${category.id}-${subcategory.id}`;
                        const isChecked = selectedIndicators.has(key);

                        return (
                          <div key={subcategory.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={isChecked}
                              onCheckedChange={() => toggleIndicator(category.id, subcategory.id)}
                            />
                            <Label
                              htmlFor={key}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {subcategory.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedIndicators.size} indicator{selectedIndicators.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                Save Indicators
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
