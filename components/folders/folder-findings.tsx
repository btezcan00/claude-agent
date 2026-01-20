'use client';

import { useState } from 'react';
import { Folder, FOLDER_STATUSES } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { getUserById, getUserFullName } from '@/data/mock-users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, Search } from 'lucide-react';
import { AddFindingsDialog } from './add-findings-dialog';

interface FolderFindingsProps {
  folder: Folder;
}

export function FolderFindings({ folder }: FolderFindingsProps) {
  const { addFinding, removeFinding } = useFolders();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getPhaseLabel = (phase: string) => {
    const status = FOLDER_STATUSES.find((s) => s.value === phase);
    return status?.label || phase;
  };

  const getPhaseColor = (phase: string) => {
    const status = FOLDER_STATUSES.find((s) => s.value === phase);
    return status?.color || '#6b7280';
  };

  const getAssignedUserName = (userId?: string) => {
    if (!userId) return null;
    const user = getUserById(userId);
    return user ? getUserFullName(user) : null;
  };

  const items = folder.findings || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Findings
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings added</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const assignedUserName = getAssignedUserName(item.assignedTo);
                return (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.label}</span>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getPhaseColor(item.phase),
                              color: getPhaseColor(item.phase),
                            }}
                            className="text-xs"
                          >
                            {getPhaseLabel(item.phase)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                        {assignedUserName && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {assignedUserName}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFinding(folder.id, item.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFindingsDialog
        folder={folder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={(item) => addFinding(folder.id, item)}
      />
    </>
  );
}
