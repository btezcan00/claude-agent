'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Person } from '@/types/person';

interface BrpSearchParams {
  bsn?: string;
  surname?: string;
  firstName?: string;
  dateOfBirth?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  municipality?: string;
}

interface PersonContextValue {
  people: Person[];
  isLoading: boolean;

  // Person CRUD
  createPerson: (data: Omit<Person, 'id' | 'createdAt'>) => Promise<Person>;
  updatePerson: (id: string, data: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  getPersonById: (id: string) => Person | undefined;
  searchPeople: (query: string) => Person[];
  refreshPeople: () => Promise<void>;

  // BRP Search
  searchBrp: (params: BrpSearchParams) => Promise<Person[]>;
}

const PersonContext = createContext<PersonContextValue | null>(null);

export function PersonProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch people from API on mount
  const fetchPeople = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/people');
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
      }
    } catch (error) {
      console.error('Failed to fetch people:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const refreshPeople = useCallback(async () => {
    await fetchPeople();
  }, [fetchPeople]);

  const createPerson = useCallback(async (data: Omit<Person, 'id' | 'createdAt'>): Promise<Person> => {
    const response = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create person');
    }

    const newPerson = await response.json();
    setPeople((prev) => [newPerson, ...prev]);
    return newPerson;
  }, []);

  const updatePerson = useCallback(async (id: string, data: Partial<Person>) => {
    const response = await fetch(`/api/people/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update person');
    }

    const updatedPerson = await response.json();
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? updatedPerson : p))
    );
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    const response = await fetch(`/api/people/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete person');
    }

    setPeople((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPersonById = useCallback((id: string): Person | undefined => {
    return people.find((p) => p.id === id);
  }, [people]);

  const searchPeople = useCallback((query: string): Person[] => {
    if (!query.trim()) return people;
    const q = query.toLowerCase();
    return people.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.surname.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.bsn && p.bsn.includes(q))
    );
  }, [people]);

  const searchBrp = useCallback(async (params: BrpSearchParams): Promise<Person[]> => {
    const response = await fetch('/api/people/brp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to search BRP');
    }

    return response.json();
  }, []);

  const value: PersonContextValue = {
    people,
    isLoading,
    createPerson,
    updatePerson,
    deletePerson,
    getPersonById,
    searchPeople,
    refreshPeople,
    searchBrp,
  };

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}

export function usePeople(): PersonContextValue {
  const context = useContext(PersonContext);
  if (!context) {
    throw new Error('usePeople must be used within a PersonProvider');
  }
  return context;
}
