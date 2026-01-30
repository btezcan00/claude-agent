'use client';

import { useState, useEffect } from 'react';
import { Case, UpdateCaseInput } from '@/types/case';
import { CASE_COLORS } from '@/types/case';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
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
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseEditDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function CaseEditDialog({ caseItem, open, onClose }: CaseEditDialogProps) {
  const { updateCase } = useCases();
  const { users, getUserFullName } = useUsers();
  const [formData, setFormData] = useState<UpdateCaseInput>({
    name: caseItem.name,
    description: caseItem.description,
    ownerId: caseItem.ownerId || undefined,
    color: caseItem.color,
  });

  useEffect(() => {
    setFormData({
      name: caseItem.name,
      description: caseItem.description,
      ownerId: caseItem.ownerId || undefined,
      color: caseItem.color,
    });
  }, [caseItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCase(caseItem.id, formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Update the case details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CASE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                      formData.color === color.value && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {formData.color === color.value && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: undefined })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-transform hover:scale-110',
                    !formData.color && 'ring-2 ring-offset-2 ring-primary'
                  )}
                  title="No color"
                >
                  {!formData.color && (
                    <Check className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Select
                value={formData.ownerId || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    ownerId: value === 'none' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No owner</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserFullName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
