'use client';

import { useState } from 'react';
import { LETTER_TEMPLATES } from '@/types/case';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddLetterDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; template: string }) => void;
}

export function AddLetterDialog({ open, onClose, onAdd }: AddLetterDialogProps) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !template) return;

    onAdd({
      name: name.trim(),
      template,
    });
    setName('');
    setTemplate('');
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName('');
      setTemplate('');
      onClose();
    }
  };

  const isValid = name.trim() && template;

  const selectedTemplate = LETTER_TEMPLATES.find((t) => t.value === template);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Naam */}
          <div className="space-y-2">
            <Label>
              Naam <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Voer documentnaam in"
            />
          </div>

          {/* Sjabloon */}
          <div className="space-y-2">
            <Label>
              Sjabloon <span className="text-destructive">*</span>
            </Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een sjabloon" />
              </SelectTrigger>
              <SelectContent>
                {LETTER_TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label.length > 40 ? `${t.label.slice(0, 40)}...` : t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Opslaan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
