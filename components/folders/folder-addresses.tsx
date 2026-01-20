'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { Address } from '@/types/address';
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
import { Home, Plus, X } from 'lucide-react';
import { AddAddressDialog } from './add-address-dialog';
import { AddressFormDialog } from './address-form-dialog';

interface FolderAddressesProps {
  folder: Folder;
}

export function FolderAddresses({ folder }: FolderAddressesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const { removeAddress } = useFolders();

  const addresses = folder.addresses || [];

  const handleRowClick = (addr: Address) => {
    setSelectedAddress(addr);
    setEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            <CardTitle>Known Addresses</CardTitle>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No addresses associated with this folder.</p>
            <p className="text-sm mt-1">Click &quot;Add&quot; to associate addresses.</p>
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
              {addresses.map((addr) => (
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
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAddress(folder.id, addr.id);
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

      <AddAddressDialog
        folder={folder}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {selectedAddress && (
        <AddressFormDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAddress(null);
          }}
          onAddressCreated={() => {
            setEditDialogOpen(false);
            setSelectedAddress(null);
          }}
          initialAddress={selectedAddress}
        />
      )}
    </Card>
  );
}
