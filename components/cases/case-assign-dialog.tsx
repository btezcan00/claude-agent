'use client';

import { useState } from 'react';
import { Case } from '@/types/case';
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
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, User } from 'lucide-react';

interface CaseAssignDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function CaseAssignDialog({
  caseItem,
  open,
  onClose,
}: CaseAssignDialogProps) {
  const { assignCase, unassignCase } = useCases();
  const { users, getUserFullName, getUserInitials } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    caseItem.assigneeId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        assignCase(caseItem.id, user.id, getUserFullName(user));
      }
    } else {
      unassignCase(caseItem.id);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Case</DialogTitle>
          <DialogDescription>
            Select a team member to assign this case to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Label className="mb-3 block">Team Members</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {/* Unassigned Option */}
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                  selectedUserId === null
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Unassigned</p>
                  <p className="text-sm text-muted-foreground">
                    Remove current assignment
                  </p>
                </div>
                {selectedUserId === null && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>

              {/* User Options */}
              {users.map((user) => {
                const isSelected = selectedUserId === user.id;
                const workloadPercent = Math.round(
                  (user.activeCasesCount / user.maxCaseCapacity) * 100
                );
                const isOverloaded = workloadPercent >= 100;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {getUserFullName(user)}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              isOverloaded
                                ? 'bg-destructive'
                                : workloadPercent > 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(workloadPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {user.activeCasesCount}/{user.maxCaseCapacity} cases
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedUserId ? 'Assign' : 'Unassign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
