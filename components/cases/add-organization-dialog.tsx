'use client';

import { useState, useMemo } from 'react';
import { Case } from '@/types/case';
import { Organization } from '@/types/organization';
import { useOrganizations } from '@/context/organization-context';
import { useCases } from '@/context/case-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Building2 } from 'lucide-react';
import { OrganizationFormDialog } from './organization-form-dialog';

interface AddOrganizationDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function AddOrganizationDialog({
  caseItem,
  open,
  onClose,
}: AddOrganizationDialogProps) {
  const { organizations } = useOrganizations();
  const { addOrganizationToCase } = useCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const handleRowClick = (org: Organization) => {
    setSelectedOrganization(org);
    setFormDialogOpen(true);
  };

  // Get existing organization IDs in the case
  const existingOrgIds = useMemo(() => {
    return new Set((caseItem.organizations || []).map((org) => org.id));
  }, [caseItem.organizations]);

  // Filter organizations that are not already in the case
  const availableOrganizations = useMemo(() => {
    return organizations.filter((org) => !existingOrgIds.has(org.id));
  }, [organizations, existingOrgIds]);

  // Filter by search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return availableOrganizations;
    const query = searchQuery.toLowerCase();
    return availableOrganizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.address.toLowerCase().includes(query) ||
        org.type.toLowerCase().includes(query) ||
        (org.description || '').toLowerCase().includes(query)
    );
  }, [availableOrganizations, searchQuery]);

  const handleAddOrganization = (org: Organization) => {
    addOrganizationToCase(caseItem.id, org);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleNewOrganizationCreated = (org: Organization) => {
    // Add the newly created organization to the case
    addOrganizationToCase(caseItem.id, org);
    setFormDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[80vw] max-w-none sm:max-w-none max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Organisatie Toevoegen aan Dossier</DialogTitle>
            <DialogDescription>
              Zoek bestaande organisaties of voeg een nieuwe toe aan: {caseItem.name}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek organisaties op naam, adres of type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Organization Table */}
          <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-[300px]">
            {filteredOrganizations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {availableOrganizations.length === 0
                    ? 'Alle organisaties zijn al toegevoegd aan dit dossier'
                    : 'Geen organisaties gevonden voor uw zoekopdracht'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(org)}
                    >
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {org.address}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddOrganization(org);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Toevoegen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer with Add New button */}
          <div className="flex justify-between items-center border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOrganization(null);
                setFormDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nieuwe organisatie toevoegen
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Organization Form Dialog (New or Edit) */}
      <OrganizationFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedOrganization(null);
        }}
        onOrganizationCreated={handleNewOrganizationCreated}
        initialOrganization={selectedOrganization || undefined}
      />
    </>
  );
}
