'use client';

import { useState, useMemo } from 'react';
import { Case } from '@/types/case';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Radio } from 'lucide-react';
import { SIGNAL_TYPE_CONFIG } from '@/lib/constants';

interface CaseAddSignalsDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function CaseAddSignalsDialog({
  caseItem,
  open,
  onClose,
}: CaseAddSignalsDialogProps) {
  const { signals, addSignalsToCase } = useSignals();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);

  // Get signals not already in this case
  const availableSignals = useMemo(() => {
    return signals.filter((signal) => !signal.caseRelations.some(cr => cr.caseId === caseItem.id));
  }, [signals, caseItem.id]);

  // Filter by search query
  const filteredSignals = useMemo(() => {
    if (!searchQuery.trim()) return availableSignals;
    const query = searchQuery.toLowerCase();
    return availableSignals.filter(
      (signal) =>
        signal.signalNumber.toLowerCase().includes(query) ||
        signal.description.toLowerCase().includes(query) ||
        signal.placeOfObservation.toLowerCase().includes(query)
    );
  }, [availableSignals, searchQuery]);

  const handleToggleSignal = (signalId: string) => {
    setSelectedSignalIds((prev) =>
      prev.includes(signalId)
        ? prev.filter((id) => id !== signalId)
        : [...prev, signalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSignalIds.length === filteredSignals.length) {
      setSelectedSignalIds([]);
    } else {
      setSelectedSignalIds(filteredSignals.map((s) => s.id));
    }
  };

  const handleAddSignals = () => {
    if (selectedSignalIds.length > 0) {
      addSignalsToCase(selectedSignalIds, caseItem.id);
      setSelectedSignalIds([]);
      setSearchQuery('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedSignalIds([]);
    setSearchQuery('');
    onClose();
  };

  const getTypeConfig = (type: string) => {
    return SIGNAL_TYPE_CONFIG[type as keyof typeof SIGNAL_TYPE_CONFIG];
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Signals to Case</DialogTitle>
          <DialogDescription>
            Select signals to add to: {caseItem.name}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select All */}
        {filteredSignals.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedSignalIds.length === filteredSignals.length &&
                  filteredSignals.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredSignals.length})
              </span>
            </div>
            {selectedSignalIds.length > 0 && (
              <span className="text-sm font-medium">
                {selectedSignalIds.length} selected
              </span>
            )}
          </div>
        )}

        {/* Signal List */}
        <div className="flex-1 -mx-6 px-6 overflow-y-auto">
          {filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Radio className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {availableSignals.length === 0
                  ? 'All signals are already in this case'
                  : 'No signals match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredSignals.map((signal) => {
                const isSelected = selectedSignalIds.includes(signal.id);

                return (
                  <div
                    key={signal.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    onClick={() => handleToggleSignal(signal.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSignal(signal.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {signal.signalNumber}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {signal.placeOfObservation}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {signal.types.slice(0, 2).map((type) => {
                          const typeConfig = getTypeConfig(type);
                          return (
                            <Badge
                              key={type}
                              variant="secondary"
                              className="text-xs"
                            >
                              {typeConfig?.label || type}
                            </Badge>
                          );
                        })}
                        {signal.types.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{signal.types.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSignals}
            disabled={selectedSignalIds.length === 0}
          >
            Add {selectedSignalIds.length > 0 && `(${selectedSignalIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
