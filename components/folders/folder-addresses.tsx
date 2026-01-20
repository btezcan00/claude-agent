'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Plus, X } from 'lucide-react';

interface FolderAddressesProps {
  folder: Folder;
}

export function FolderAddresses({ folder }: FolderAddressesProps) {
  const { addAddress, removeAddress } = useFolders();
  const [newAddress, setNewAddress] = useState('');

  const addresses = folder.addresses || [];

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      addAddress(folder.id, newAddress.trim());
      setNewAddress('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4" />
          Known Addresses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses</p>
          ) : (
            addresses.map((addr) => (
              <Badge key={addr} variant="secondary" className="gap-1">
                {addr}
                <button
                  onClick={() => removeAddress(folder.id, addr)}
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
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Add address"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAddress()}
          />
          <Button size="sm" variant="outline" onClick={handleAddAddress}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
