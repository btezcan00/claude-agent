'use client';

import { useState, useEffect } from 'react';
import { Case, CaseType, PriorityLevel, UpdateCaseInput } from '@/types/case';
import { useCases } from '@/context/case-context';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CASE_TYPES,
  PRIORITY_LEVELS,
  CASE_TYPE_CONFIG,
  PRIORITY_CONFIG,
} from '@/lib/constants';
import { formatDateForInput } from '@/lib/date-utils';

interface CaseEditDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function CaseEditDialog({ caseItem, open, onClose }: CaseEditDialogProps) {
  const { updateCase } = useCases();
  const [formData, setFormData] = useState<UpdateCaseInput>({
    title: caseItem.title,
    description: caseItem.description,
    type: caseItem.type,
    priority: caseItem.priority,
    dueDate: formatDateForInput(caseItem.dueDate),
    location: caseItem.location || '',
  });

  useEffect(() => {
    setFormData({
      title: caseItem.title,
      description: caseItem.description,
      type: caseItem.type,
      priority: caseItem.priority,
      dueDate: formatDateForInput(caseItem.dueDate),
      location: caseItem.location || '',
    });
  }, [caseItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCase(caseItem.id, formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update the case details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Case Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CaseType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CASE_TYPE_CONFIG[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: PriorityLevel) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_CONFIG[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dueDate: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
