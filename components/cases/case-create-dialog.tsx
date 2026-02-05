'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCases } from '@/context/case-context';
import { useUsers } from '@/context/user-context';
import { CreateCaseInput } from '@/types/case';
import { CASE_COLORS } from '@/types/case';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseCreateDialogProps {
  children?: React.ReactNode;
  signalIds?: string[];
}

export function CaseCreateDialog({ children, signalIds }: CaseCreateDialogProps) {
  const router = useRouter();
  const { createCase } = useCases();
  const { users, getUserFullName } = useUsers();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCaseInput>({
    name: '',
    description: '',
    ownerId: undefined,
    color: undefined,
    signalIds: signalIds,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newCase = await createCase({
      ...formData,
      signalIds,
    });
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      ownerId: undefined,
      color: undefined,
    });
    router.push(`/dossiers/${newCase.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Dossier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nieuw Dossier Aanmaken</DialogTitle>
          <DialogDescription>
            Maak een dossier aan om je meldingen te organiseren.
            {signalIds && signalIds.length > 0 && (
              <span className="block mt-1 text-primary">
                {signalIds.length} melding(en) worden aan dit dossier toegevoegd.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                placeholder="Voer dossiernaam in"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                placeholder="Voer dossieromschrijving in"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Kleur</Label>
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
                  title="Geen kleur"
                >
                  {!formData.color && (
                    <Check className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="owner">Eigenaar</Label>
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
                  <SelectValue placeholder="Selecteer eigenaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen eigenaar</SelectItem>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Dossier Aanmaken
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
