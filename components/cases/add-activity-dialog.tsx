'use client';

import { useState, useEffect } from 'react';
import { CaseStatus, CASE_STATUSES } from '@/types/case';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (activity: { date: string; phase: CaseStatus; label: string; description: string }) => void;
  currentPhase: CaseStatus;
}

export function AddActivityDialog({ open, onClose, onAdd, currentPhase }: AddActivityDialogProps) {
  const [date, setDate] = useState('');
  const [phase, setPhase] = useState<CaseStatus>(currentPhase);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  // Reset form and set current date when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const formatted = now.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setDate(formatted);
      setPhase(currentPhase);
      setLabel('');
      setDescription('');
    }
  }, [open, currentPhase]);

  const handleSubmit = () => {
    if (!label.trim() || !description.trim()) return;

    onAdd({
      date,
      phase,
      label: label.trim(),
      description: description.trim(),
    });
    onClose();
  };

  const isValid = label.trim() && description.trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activiteit Toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Datum</Label>
            <Input value={date} readOnly className="bg-muted" />
          </div>

          {/* Phase */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Fase</Label>
            <Select value={phase} onValueChange={(value) => setPhase(value as CaseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Voer label in"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              Omschrijving <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Geef een volledige omschrijving"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!isValid}>
            Toevoegen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
