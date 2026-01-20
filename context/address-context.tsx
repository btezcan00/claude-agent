'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Address } from '@/types/address';

interface AddressContextValue {
  addresses: Address[];
  isLoading: boolean;

  // Address CRUD
  createAddress: (data: Omit<Address, 'id' | 'createdAt'>) => Promise<Address>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  getAddressById: (id: string) => Address | undefined;
  searchAddresses: (query: string) => Address[];
  refreshAddresses: () => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | null>(null);

export function AddressProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch addresses from API on mount
  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const refreshAddresses = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(async (data: Omit<Address, 'id' | 'createdAt'>): Promise<Address> => {
    const response = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create address');
    }

    const newAddress = await response.json();
    setAddresses((prev) => [newAddress, ...prev]);
    return newAddress;
  }, []);

  const updateAddress = useCallback(async (id: string, data: Partial<Address>) => {
    const response = await fetch(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update address');
    }

    const updatedAddress = await response.json();
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? updatedAddress : a))
    );
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    const response = await fetch(`/api/addresses/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete address');
    }

    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAddressById = useCallback((id: string): Address | undefined => {
    return addresses.find((a) => a.id === id);
  }, [addresses]);

  const searchAddresses = useCallback((query: string): Address[] => {
    if (!query.trim()) return addresses;
    const q = query.toLowerCase();
    return addresses.filter(
      (a) =>
        a.street.toLowerCase().includes(q) ||
        a.buildingType.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [addresses]);

  const value: AddressContextValue = {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressById,
    searchAddresses,
    refreshAddresses,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses(): AddressContextValue {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
}
