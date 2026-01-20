'use client';

import { useState, useMemo, useEffect } from 'react';
import { Organization, ORGANIZATION_TYPES, MOCK_ADDRESSES } from '@/types/organization';
import { useOrganizations } from '@/context/organization-context';
import { OrganizationSelectDialog } from './organization-select-dialog';
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
import { Switch } from '@/components/ui/switch';
import { MapPin, Search, BookOpen } from 'lucide-react';

interface OrganizationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onOrganizationCreated: (org: Organization) => void;
  initialOrganization?: Organization;
}

export function OrganizationFormDialog({
  open,
  onClose,
  onOrganizationCreated,
  initialOrganization,
}: OrganizationFormDialogProps) {
  const { organizations, createOrganization } = useOrganizations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [chamberOfCommerce, setChamberOfCommerce] = useState('');
  const [useAddress, setUseAddress] = useState(true);
  const [address, setAddress] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Populate form when initialOrganization is provided
  useEffect(() => {
    if (initialOrganization) {
      setName(initialOrganization.name);
      setType(initialOrganization.type);
      setDescription(initialOrganization.description || '');
      setChamberOfCommerce(initialOrganization.chamberOfCommerce || '');
      setAddress(initialOrganization.address || '');
      setAddressQuery(initialOrganization.address || '');
      setEditMode(true);
      setEditingOrgId(initialOrganization.id);
    }
  }, [initialOrganization]);

  // Filter addresses based on query
  const filteredAddresses = useMemo(() => {
    if (!addressQuery.trim()) return [];
    const query = addressQuery.toLowerCase();
    return MOCK_ADDRESSES.filter((addr) =>
      addr.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [addressQuery]);

  // Filter organizations based on address
  const filteredOrganizations = useMemo(() => {
    if (!address.trim()) return [];
    const query = address.toLowerCase().trim();
    return organizations.filter(
      (org) => org.address && org.address.toLowerCase().includes(query)
    );
  }, [organizations, address]);

  // Handle selection from select dialog
  const handleOrganizationSelected = (selectedOrgs: Organization[]) => {
    if (selectedOrgs.length > 0) {
      const selected = selectedOrgs[0];
      // Populate form with selected organization data (except description - user provides that)
      setName(selected.name);
      setType(selected.type);
      setChamberOfCommerce(selected.chamberOfCommerce || '');
      setAddress(selected.address || '');
      setAddressQuery(selected.address || '');
      setEditMode(true);
      setEditingOrgId(selected.id);
    }
    setSelectDialogOpen(false);
  };

  const handleAddressSelect = (selectedAddress: string) => {
    setAddress(selectedAddress);
    setAddressQuery(selectedAddress);
    setShowAddressDropdown(false);
  };

  const handleAddressInputChange = (value: string) => {
    setAddressQuery(value);
    setAddress(value);
    setShowAddressDropdown(value.trim().length > 0);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newOrg = await createOrganization({
        name: name.trim(),
        type: type || 'Other',
        address: useAddress ? address : '',
        description: description.trim(),
        chamberOfCommerce: chamberOfCommerce.trim() || undefined,
      });
      onOrganizationCreated(newOrg);
      handleClose();
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setType('');
    setDescription('');
    setChamberOfCommerce('');
    setUseAddress(true);
    setAddress('');
    setAddressQuery('');
    setShowAddressDropdown(false);
    setEditMode(false);
    setEditingOrgId(null);
    onClose();
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Change organization' : 'Add New Organization'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Review and modify the organization details.'
              : 'Create a new organization that will be added to the global registry.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Name *</Label>
            <Input
              id="org-name"
              placeholder="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="org-type">Type of Organization</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="org-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map((orgType) => (
                  <SelectItem key={orgType} value={orgType}>
                    {orgType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="use-address">Include Address</Label>
            </div>
            <Switch
              id="use-address"
              checked={useAddress}
              onCheckedChange={setUseAddress}
            />
          </div>

          {/* Address Field with Autocomplete */}
          {useAddress && (
            <div className="space-y-2 relative">
              <Label htmlFor="org-address">Address</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="org-address"
                  placeholder="Search or enter address..."
                  value={addressQuery}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onFocus={() => setShowAddressDropdown(addressQuery.trim().length > 0)}
                  className="pl-9"
                />
              </div>
              {/* Address Dropdown */}
              {showAddressDropdown && filteredAddresses.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredAddresses.map((addr, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onClick={() => handleAddressSelect(addr)}
                    >
                      {addr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              placeholder="Brief description of the organization..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Chamber of Commerce */}
          <div className="space-y-2">
            <Label htmlFor="org-coc">Chamber of Commerce Number</Label>
            <Input
              id="org-coc"
              placeholder="e.g., 12345678"
              value={chamberOfCommerce}
              onChange={(e) => setChamberOfCommerce(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button
            variant="outline"
            onClick={() => setSelectDialogOpen(true)}
            disabled={!address.trim()}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Consult Sources
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save' : 'Add Organization')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <OrganizationSelectDialog
        open={selectDialogOpen}
        onClose={() => setSelectDialogOpen(false)}
        organizations={filteredOrganizations}
        onConfirm={handleOrganizationSelected}
        title="Select the correct organization"
        description="Choose from existing organizations that match your search."
      />
    </Dialog>
  );
}
