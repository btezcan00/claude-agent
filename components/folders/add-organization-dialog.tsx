'use client';

import { useState, useMemo } from 'react';
import { Folder } from '@/types/folder';
import { Organization } from '@/types/organization';
import { useOrganizations } from '@/context/organization-context';
import { useFolders } from '@/context/folder-context';
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
  folder: Folder;
  open: boolean;
  onClose: () => void;
}

export function AddOrganizationDialog({
  folder,
  open,
  onClose,
}: AddOrganizationDialogProps) {
  const { organizations } = useOrganizations();
  const { addOrganizationToFolder } = useFolders();
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  // Get existing organization IDs in the folder
  const existingOrgIds = useMemo(() => {
    return new Set((folder.organizations || []).map((org) => org.id));
  }, [folder.organizations]);

  // Filter organizations that are not already in the folder
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
        org.description.toLowerCase().includes(query)
    );
  }, [availableOrganizations, searchQuery]);

  const handleAddOrganization = (org: Organization) => {
    addOrganizationToFolder(folder.id, org);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleNewOrganizationCreated = (org: Organization) => {
    // Add the newly created organization to the folder
    addOrganizationToFolder(folder.id, org);
    setFormDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Organization to Folder</DialogTitle>
            <DialogDescription>
              Search existing organizations or add a new one to: {folder.name}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations by name, address, or type..."
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
                    ? 'All organizations are already in this folder'
                    : 'No organizations match your search'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {org.address}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddOrganization(org)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
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
              onClick={() => setFormDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add new organization
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Organization Form Dialog */}
      <OrganizationFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onOrganizationCreated={handleNewOrganizationCreated}
      />
    </>
  );
}
