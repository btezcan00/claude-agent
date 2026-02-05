'use client';

import { useState } from 'react';
import { Case } from '@/types/case';
import { useCases } from '@/context/case-context';
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
import { OrganizationFormDialog } from './organization-form-dialog';
import { Organization } from '@/types/organization';

interface CaseOrganizationsProps {
  caseItem: Case;
}

export function CaseOrganizations({ caseItem }: CaseOrganizationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const { removeOrganization } = useCases();

  const organizations = caseItem.organizations || [];

  const handleRowClick = (org: Organization) => {
    setSelectedOrganization(org);
    setEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>Gekoppelde Organisaties</CardTitle>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Toevoegen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Geen organisaties gekoppeld aan dit dossier.</p>
            <p className="text-sm mt-1">Klik op &quot;Toevoegen&quot; om organisaties te koppelen.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(org)}
                >
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {org.address || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOrganization(caseItem.id, org.id);
                      }}
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
        caseItem={caseItem}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {selectedOrganization && (
        <OrganizationFormDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedOrganization(null);
          }}
          onOrganizationCreated={() => {
            setEditDialogOpen(false);
            setSelectedOrganization(null);
          }}
          initialOrganization={selectedOrganization}
        />
      )}
    </Card>
  );
}
