'use client';

import { useState, useMemo } from 'react';
import { Case } from '@/types/case';
import { Address } from '@/types/address';
import { useAddresses } from '@/context/address-context';
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
import { Search, Plus, Home } from 'lucide-react';
import { AddressFormDialog } from './address-form-dialog';

interface AddAddressDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function AddAddressDialog({
  caseItem,
  open,
  onClose,
}: AddAddressDialogProps) {
  const { addresses } = useAddresses();
  const { addAddressToCase } = useCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleRowClick = (addr: Address) => {
    setSelectedAddress(addr);
    setFormDialogOpen(true);
  };

  // Get existing address IDs in the case
  const existingAddressIds = useMemo(() => {
    return new Set((caseItem.addresses || []).map((addr) => addr.id));
  }, [caseItem.addresses]);

  // Filter addresses that are not already in the case
  const availableAddresses = useMemo(() => {
    return addresses.filter((addr) => !existingAddressIds.has(addr.id));
  }, [addresses, existingAddressIds]);

  // Filter by search query
  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return availableAddresses;
    const query = searchQuery.toLowerCase();
    return availableAddresses.filter(
      (addr) =>
        addr.street.toLowerCase().includes(query) ||
        addr.buildingType.toLowerCase().includes(query) ||
        addr.description.toLowerCase().includes(query)
    );
  }, [availableAddresses, searchQuery]);

  const handleAddAddress = (addr: Address) => {
    addAddressToCase(caseItem.id, addr);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleNewAddressCreated = (addr: Address) => {
    // Add the newly created address to the case
    addAddressToCase(caseItem.id, addr);
    setFormDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[80vw] max-w-none sm:max-w-none max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add address</DialogTitle>
            <DialogDescription>
              Search for an existing address or add a new address to: {caseItem.name}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by street name, house number, postal code, city or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Address Table */}
          <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-[300px]">
            {filteredAddresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Home className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {availableAddresses.length === 0
                    ? 'All addresses have already been added to this case'
                    : 'No addresses found for your search'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Property type</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAddresses.map((addr) => (
                    <TableRow
                      key={addr.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(addr)}
                    >
                      <TableCell className="font-medium">{addr.street}</TableCell>
                      <TableCell>{addr.buildingType}</TableCell>
                      <TableCell>{addr.isActive ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {addr.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAddress(addr);
                          }}
                        >
                          <Plus className="w-4 h-4" />
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
                setSelectedAddress(null);
                setFormDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add new address
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Form Dialog (New or Edit) */}
      <AddressFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedAddress(null);
        }}
        onAddressCreated={handleNewAddressCreated}
        initialAddress={selectedAddress || undefined}
      />
    </>
  );
}
