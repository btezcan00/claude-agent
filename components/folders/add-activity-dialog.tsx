'use client';

import { useState, useEffect } from 'react';
import { FolderStatus, FOLDER_STATUSES } from '@/types/folder';
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
  onAdd: (activity: { date: string; phase: FolderStatus; label: string; description: string }) => void;
  currentPhase: FolderStatus;
}

export function AddActivityDialog({ open, onClose, onAdd, currentPhase }: AddActivityDialogProps) {
  const [date, setDate] = useState('');
  const [phase, setPhase] = useState<FolderStatus>(currentPhase);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  // Reset form and set current date when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-GB', {
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
          <DialogTitle>Add activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Date</Label>
            <Input value={date} readOnly className="bg-muted" />
          </div>

          {/* Phase */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Phase</Label>
            <Select value={phase} onValueChange={(value) => setPhase(value as FolderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLDER_STATUSES.map((status) => (
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
              placeholder="Enter label"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide a full description"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!isValid}>
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
