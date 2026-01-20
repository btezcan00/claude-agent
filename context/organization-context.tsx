'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Organization } from '@/types/organization';
import { generateId } from '@/lib/utils';

interface OrganizationContextValue {
  organizations: Organization[];
  isLoading: boolean;

  // Organization CRUD
  createOrganization: (data: Omit<Organization, 'id' | 'createdAt'>) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  getOrganizationById: (id: string) => Organization | undefined;
  searchOrganizations: (query: string) => Organization[];
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organizations from API on mount
  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const createOrganization = useCallback(async (data: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization> => {
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    const newOrganization = await response.json();
    setOrganizations((prev) => [newOrganization, ...prev]);
    return newOrganization;
  }, []);

  const updateOrganization = useCallback(async (id: string, data: Partial<Organization>) => {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update organization');
    }

    const updatedOrganization = await response.json();
    setOrganizations((prev) =>
      prev.map((o) => (o.id === id ? updatedOrganization : o))
    );
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete organization');
    }

    setOrganizations((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const getOrganizationById = useCallback((id: string): Organization | undefined => {
    return organizations.find((o) => o.id === id);
  }, [organizations]);

  const searchOrganizations = useCallback((query: string): Organization[] => {
    if (!query.trim()) return organizations;
    const q = query.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.type.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }, [organizations]);

  const value: OrganizationContextValue = {
    organizations,
    isLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    searchOrganizations,
    refreshOrganizations,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganizations(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
}
