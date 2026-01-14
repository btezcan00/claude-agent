'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderFilters,
  CreateFolderInput,
  UpdateFolderInput,
  FolderStats,
} from '@/types/folder';
import { mockFolders } from '@/data/mock-folders';
import { currentUser } from '@/data/mock-users';
import { generateId, generateFolderId } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSignals } from './signal-context';

interface FolderContextValue {
  folders: Folder[];
  filteredFolders: Folder[];
  selectedFolder: Folder | null;
  filters: FolderFilters;
  searchQuery: string;
  folderStats: FolderStats;

  // Folder CRUD
  createFolder: (data: CreateFolderInput) => Folder;
  createFolderFromSignals: (name: string, description: string, signalIds: string[]) => Folder;
  updateFolder: (id: string, data: UpdateFolderInput) => void;
  deleteFolder: (id: string) => void;
  getFolderById: (id: string) => Folder | undefined;

  // Ownership
  assignFolderOwner: (folderId: string, userId: string, userName: string) => void;
  unassignFolderOwner: (folderId: string) => void;

  // Computed
  getSignalCountForFolder: (folderId: string) => number;

  // Filter Actions
  setFilters: (filters: Partial<FolderFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (folder: Folder | null) => void;
}

const defaultFilters: FolderFilters = {
  ownerId: [],
};

const FolderContext = createContext<FolderContextValue | null>(null);

export function FolderProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useLocalStorage<Folder[]>('gcmp-folders', mockFolders);
  const [filters, setFiltersState] = useState<FolderFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { signals, addSignalsToFolder } = useSignals();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filteredFolders = useMemo(() => {
    if (!isHydrated) return [];

    let result = [...folders];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          (f.ownerName && f.ownerName.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.ownerId.length > 0) {
      result = result.filter((f) => f.ownerId && filters.ownerId.includes(f.ownerId));
    }

    // Sort by updated date
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return result;
  }, [folders, filters, searchQuery, isHydrated]);

  const folderStats = useMemo((): FolderStats => {
    if (!isHydrated) return { total: 0, withSignals: 0, empty: 0 };

    const foldersWithSignals = folders.filter((f) =>
      signals.some((s) => s.folderIds.includes(f.id))
    );

    return {
      total: folders.length,
      withSignals: foldersWithSignals.length,
      empty: folders.length - foldersWithSignals.length,
    };
  }, [folders, signals, isHydrated]);

  const getSignalCountForFolder = useCallback((folderId: string): number => {
    return signals.filter((s) => s.folderIds.includes(folderId)).length;
  }, [signals]);

  const createFolder = useCallback((data: CreateFolderInput): Folder => {
    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: generateFolderId(),
      name: data.name,
      description: data.description,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: now,
      updatedAt: now,
      ownerId: data.ownerId || null,
      ownerName: null,
      color: data.color,
      icon: data.icon,
    };

    setFolders((prev) => [newFolder, ...prev]);

    // If signalIds provided, add signals to folder
    if (data.signalIds && data.signalIds.length > 0) {
      addSignalsToFolder(data.signalIds, newFolder.id);
    }

    return newFolder;
  }, [setFolders, addSignalsToFolder]);

  const createFolderFromSignals = useCallback((name: string, description: string, signalIds: string[]): Folder => {
    return createFolder({
      name,
      description,
      signalIds,
    });
  }, [createFolder]);

  const updateFolder = useCallback((id: string, data: UpdateFolderInput) => {
    const now = new Date().toISOString();
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return { ...f, ...data, updatedAt: now };
      })
    );
  }, [setFolders]);

  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Note: Signals keep their folderIds array, but the folder no longer exists
    // This is acceptable as the folder reference becomes orphaned
  }, [setFolders]);

  const getFolderById = useCallback((id: string): Folder | undefined => {
    return folders.find((f) => f.id === id);
  }, [folders]);

  const assignFolderOwner = useCallback((folderId: string, userId: string, userName: string) => {
    const now = new Date().toISOString();
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          ownerId: userId,
          ownerName: userName,
          updatedAt: now,
        };
      })
    );
  }, [setFolders]);

  const unassignFolderOwner = useCallback((folderId: string) => {
    const now = new Date().toISOString();
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          ownerId: null,
          ownerName: null,
          updatedAt: now,
        };
      })
    );
  }, [setFolders]);

  const setFilters = useCallback((newFilters: Partial<FolderFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchQuery('');
  }, []);

  const value: FolderContextValue = {
    folders,
    filteredFolders,
    selectedFolder,
    filters,
    searchQuery,
    folderStats,
    createFolder,
    createFolderFromSignals,
    updateFolder,
    deleteFolder,
    getFolderById,
    assignFolderOwner,
    unassignFolderOwner,
    getSignalCountForFolder,
    setFilters,
    clearFilters,
    setSearchQuery,
    setSelectedFolder,
  };

  return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
}

export function useFolders(): FolderContextValue {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolders must be used within a FolderProvider');
  }
  return context;
}
