'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, X } from 'lucide-react';

interface FolderOrganizationsProps {
  folder: Folder;
}

export function FolderOrganizations({ folder }: FolderOrganizationsProps) {
  const { addOrganization, removeOrganization } = useFolders();
  const [newOrganization, setNewOrganization] = useState('');

  const organizations = folder.organizations || [];

  const handleAddOrganization = () => {
    if (newOrganization.trim()) {
      addOrganization(folder.id, newOrganization.trim());
      setNewOrganization('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Associated Organizations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations</p>
          ) : (
            organizations.map((org) => (
              <Badge key={org} variant="secondary" className="gap-1">
                {org}
                <button
                  onClick={() => removeOrganization(folder.id, org)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newOrganization}
            onChange={(e) => setNewOrganization(e.target.value)}
            placeholder="Add organization"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddOrganization()}
          />
          <Button size="sm" variant="outline" onClick={handleAddOrganization}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
