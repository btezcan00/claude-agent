'use client';

import { useState, useEffect } from 'react';
import { Address, BUILDING_TYPES } from '@/types/address';
import { useAddresses } from '@/context/address-context';
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

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  onAddressCreated: (address: Address) => void;
  initialAddress?: Address;
}

export function AddressFormDialog({
  open,
  onClose,
  onAddressCreated,
  initialAddress,
}: AddressFormDialogProps) {
  const { createAddress } = useAddresses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [street, setStreet] = useState('');
  const [buildingType, setBuildingType] = useState<string>('-');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  // Populate form when initialAddress is provided
  useEffect(() => {
    if (initialAddress) {
      setStreet(initialAddress.street);
      setBuildingType(initialAddress.buildingType);
      setIsActive(initialAddress.isActive);
      setDescription(initialAddress.description || '');
      setEditMode(true);
    }
  }, [initialAddress]);

  const handleSubmit = async () => {
    if (!street.trim()) return;

    setIsSubmitting(true);
    try {
      const newAddress = await createAddress({
        street: street.trim(),
        buildingType: buildingType || '-',
        isActive,
        description: description.trim() || '-',
      });
      onAddressCreated(newAddress);
      handleClose();
    } catch (error) {
      console.error('Failed to create address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStreet('');
    setBuildingType('-');
    setIsActive(true);
    setDescription('');
    setEditMode(false);
    onClose();
  };

  const isValid = street.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit address' : 'Add new address'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'View and edit the address details.'
              : 'Add a new address to the global register.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="address-street">Address *</Label>
            <Input
              id="address-street"
              placeholder="Street name, house number, postal code, city"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          {/* Building Type */}
          <div className="space-y-2">
            <Label htmlFor="address-type">Property type</Label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger id="address-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="address-active">Current</Label>
            <Switch
              id="address-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="address-description">Description</Label>
            <Textarea
              id="address-description"
              placeholder="Brief description of the address..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save' : 'Add address')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
