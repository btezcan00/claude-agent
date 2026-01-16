'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Folder,
  FolderFilters,
  CreateFolderInput,
  UpdateFolderInput,
  FolderStats,
  FolderStatus,
  FolderAccessLevel,
  FolderNote,
  ApplicationData,
} from '@/types/folder';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';
import { useSignals } from './signal-context';

interface FolderContextValue {
  folders: Folder[];
  filteredFolders: Folder[];
  selectedFolder: Folder | null;
  filters: FolderFilters;
  searchQuery: string;
  folderStats: FolderStats;
  isLoading: boolean;

  // Folder CRUD
  createFolder: (data: CreateFolderInput) => Promise<Folder>;
  createFolderFromSignals: (name: string, description: string, signalIds: string[]) => Promise<Folder>;
  updateFolder: (id: string, data: UpdateFolderInput) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFolderById: (id: string) => Folder | undefined;
  refreshFolders: () => Promise<void>;

  // Ownership
  assignFolderOwner: (folderId: string, userId: string, userName: string) => Promise<void>;
  unassignFolderOwner: (folderId: string) => Promise<void>;

  // Status
  updateFolderStatus: (folderId: string, status: FolderStatus) => Promise<void>;
  getFoldersByStatus: (status: FolderStatus) => Folder[];

  // Notes
  addFolderNote: (folderId: string, content: string, isAdminNote: boolean) => Promise<void>;
  removeFolderNote: (folderId: string, noteId: string) => Promise<void>;

  // Practitioners
  addPractitioner: (folderId: string, userId: string, userName: string) => Promise<void>;
  removePractitioner: (folderId: string, userId: string) => Promise<void>;

  // Sharing
  shareFolder: (folderId: string, userId: string, userName: string, accessLevel: FolderAccessLevel) => Promise<void>;
  updateShareAccess: (folderId: string, userId: string, accessLevel: FolderAccessLevel) => Promise<void>;
  removeShare: (folderId: string, userId: string) => Promise<void>;

  // Tags
  addTag: (folderId: string, tag: string) => Promise<void>;
  removeTag: (folderId: string, tag: string) => Promise<void>;

  // Location
  updateLocation: (folderId: string, location: string) => Promise<void>;

  // Application
  updateApplicationData: (folderId: string, data: Partial<ApplicationData>) => Promise<void>;
  completeApplication: (folderId: string) => Promise<void>;

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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filters, setFiltersState] = useState<FolderFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { signals, addSignalsToFolder } = useSignals();

  // Fetch folders from API on mount
  const fetchFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const refreshFolders = useCallback(async () => {
    await fetchFolders();
  }, [fetchFolders]);

  const filteredFolders = useMemo(() => {
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
  }, [folders, filters, searchQuery]);

  const folderStats = useMemo((): FolderStats => {
    const foldersWithSignals = folders.filter((f) =>
      signals.some((s) => s.folderRelations.some(fr => fr.folderId === f.id))
    );

    return {
      total: folders.length,
      withSignals: foldersWithSignals.length,
      empty: folders.length - foldersWithSignals.length,
    };
  }, [folders, signals]);

  const getSignalCountForFolder = useCallback((folderId: string): number => {
    return signals.filter((s) => s.folderRelations.some(fr => fr.folderId === folderId)).length;
  }, [signals]);

  const createFolder = useCallback(async (data: CreateFolderInput): Promise<Folder> => {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    const newFolder = await response.json();
    setFolders((prev) => [newFolder, ...prev]);

    // If signalIds provided, add signals to folder
    if (data.signalIds && data.signalIds.length > 0) {
      await addSignalsToFolder(data.signalIds, newFolder.id);
    }

    return newFolder;
  }, [addSignalsToFolder]);

  const createFolderFromSignals = useCallback(async (name: string, description: string, signalIds: string[]): Promise<Folder> => {
    return createFolder({
      name,
      description,
      signalIds,
    });
  }, [createFolder]);

  const updateFolder = useCallback(async (id: string, data: UpdateFolderInput) => {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update folder');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? updatedFolder : f))
    );
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete folder');
    }

    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const getFolderById = useCallback((id: string): Folder | undefined => {
    return folders.find((f) => f.id === id);
  }, [folders]);

  const assignFolderOwner = useCallback(async (folderId: string, userId: string, userName: string) => {
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: userId,
        ownerName: userName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign folder owner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  const unassignFolderOwner = useCallback(async (folderId: string) => {
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: null,
        ownerName: null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to unassign folder owner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  const updateFolderStatus = useCallback(async (folderId: string, status: FolderStatus) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        statusDates: {
          ...folder.statusDates,
          [status]: now,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update folder status');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const getFoldersByStatus = useCallback((status: FolderStatus): Folder[] => {
    return folders.filter((f) => f.status === status);
  }, [folders]);

  // Notes
  const addFolderNote = useCallback(async (folderId: string, content: string, isAdminNote: boolean) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const newNote: FolderNote = {
      id: generateId(),
      content,
      createdAt: now,
      createdBy: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      isAdminNote,
    };

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: [...(folder.notes || []), newNote],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add folder note');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeFolderNote = useCallback(async (folderId: string, noteId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: (folder.notes || []).filter((n) => n.id !== noteId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove folder note');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Practitioners
  const addPractitioner = useCallback(async (folderId: string, userId: string, userName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if ((folder.practitioners || []).some((p) => p.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: [...(folder.practitioners || []), { userId, userName, addedAt: now }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add practitioner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removePractitioner = useCallback(async (folderId: string, userId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: (folder.practitioners || []).filter((p) => p.userId !== userId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove practitioner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Sharing
  const shareFolder = useCallback(async (folderId: string, userId: string, userName: string, accessLevel: FolderAccessLevel) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if ((folder.sharedWith || []).some((s) => s.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: [
          ...(folder.sharedWith || []),
          {
            userId,
            userName,
            accessLevel,
            sharedAt: now,
            sharedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to share folder');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const updateShareAccess = useCallback(async (folderId: string, userId: string, accessLevel: FolderAccessLevel) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: (folder.sharedWith || []).map((s) =>
          s.userId === userId ? { ...s, accessLevel } : s
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update share access');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeShare = useCallback(async (folderId: string, userId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: (folder.sharedWith || []).filter((s) => s.userId !== userId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove share');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Tags
  const addTag = useCallback(async (folderId: string, tag: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    if ((folder.tags || []).includes(tag)) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: [...(folder.tags || []), tag],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add tag');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeTag = useCallback(async (folderId: string, tag: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: (folder.tags || []).filter((t) => t !== tag),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove tag');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Location
  const updateLocation = useCallback(async (folderId: string, location: string) => {
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      throw new Error('Failed to update location');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  // Application
  const updateApplicationData = useCallback(async (folderId: string, data: Partial<ApplicationData>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}/application`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationData: data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update application data');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const completeApplication = useCallback(async (folderId: string) => {
    const response = await fetch(`/api/folders/${folderId}/application`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complete: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete application');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

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
    isLoading,
    createFolder,
    createFolderFromSignals,
    updateFolder,
    deleteFolder,
    getFolderById,
    refreshFolders,
    assignFolderOwner,
    unassignFolderOwner,
    updateFolderStatus,
    getFoldersByStatus,
    addFolderNote,
    removeFolderNote,
    addPractitioner,
    removePractitioner,
    shareFolder,
    updateShareAccess,
    removeShare,
    addTag,
    removeTag,
    updateLocation,
    updateApplicationData,
    completeApplication,
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
