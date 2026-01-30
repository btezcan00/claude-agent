'use client';

import { useState } from 'react';
import { Case, FindingItem } from '@/types/case';
import { FINDING_TYPES, FindingType } from '@/data/finding-types';
import { mockUsers, getUserFullName } from '@/data/mock-users';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AddFindingsDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<FindingItem, 'id'>) => void;
}

export function AddFindingsDialog({
  caseItem,
  open,
  onClose,
  onAdd,
}: AddFindingsDialogProps) {
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);

  const handleToggleFinding = (findingId: string) => {
    setSelectedFindings((prev) =>
      prev.includes(findingId)
        ? prev.filter((id) => id !== findingId)
        : [...prev, findingId]
    );
  };

  const handleAdd = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    selectedFindings.forEach((findingId) => {
      const findingType = FINDING_TYPES.find((f) => f.id === findingId);
      if (findingType) {
        onAdd({
          date: formatted,
          phase: caseItem.status,
          label: findingType.label,
          description: '',
          assignedTo: assignedTo,
          severity: findingType.severity,
          isCompleted: false,
          totalSteps: 1,
          completedSteps: 0,
        });
      }
    });
    onClose();
  };

  const handleClose = () => {
    setAssignedTo('');
    setSelectedFindings([]);
    onClose();
  };

  const isValid = assignedTo && selectedFindings.length > 0;

  const getSeverityStyles = (severity: FindingType['severity'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-primary/10 border-primary';
    }
    if (severity === 'serious') {
      return 'bg-amber-50 border-amber-200 hover:border-amber-300';
    }
    return 'border-muted hover:border-muted-foreground/30';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add findings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Assigned to */}
          <div className="space-y-2">
            <Label>
              Assigned to <span className="text-destructive">*</span>
            </Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserFullName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <Label>Findings</Label>
            <div className="space-y-2">
              {FINDING_TYPES.map((findingType) => {
                const isSelected = selectedFindings.includes(findingType.id);

                return (
                  <div
                    key={findingType.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      getSeverityStyles(findingType.severity, isSelected)
                    )}
                    onClick={() => handleToggleFinding(findingType.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleFinding(findingType.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm">{findingType.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={!isValid}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
