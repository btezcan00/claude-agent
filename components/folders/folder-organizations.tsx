'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Plus, X } from 'lucide-react';
import { AddOrganizationDialog } from './add-organization-dialog';

interface FolderOrganizationsProps {
  folder: Folder;
}

export function FolderOrganizations({ folder }: FolderOrganizationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { removeOrganization } = useFolders();

  const organizations = folder.organizations || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>Associated Organizations</CardTitle>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No organizations associated with this folder.</p>
            <p className="text-sm mt-1">Click &quot;Add&quot; to associate organizations.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {org.address || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrganization(folder.id, org.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddOrganizationDialog
        folder={folder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Card>
  );
}
