'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFolders } from '@/context/folder-context';
import { useUsers } from '@/context/user-context';
import { CreateFolderInput } from '@/types/folder';
import { FOLDER_COLORS } from '@/types/folder';
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

interface FolderCreateDialogProps {
  children?: React.ReactNode;
  signalIds?: string[];
}

export function FolderCreateDialog({ children, signalIds }: FolderCreateDialogProps) {
  const router = useRouter();
  const { createFolder } = useFolders();
  const { users, getUserFullName } = useUsers();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateFolderInput>({
    name: '',
    description: '',
    ownerId: undefined,
    color: undefined,
    signalIds: signalIds,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newFolder = await createFolder({
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
    router.push(`/folders/${newFolder.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your signals.
            {signalIds && signalIds.length > 0 && (
              <span className="block mt-1 text-primary">
                {signalIds.length} signal(s) will be added to this folder.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter folder name"
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
                placeholder="Enter folder description"
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
                {FOLDER_COLORS.map((color) => (
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
