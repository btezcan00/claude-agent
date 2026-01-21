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
  FolderItem,
  FindingItem,
  FolderAttachment,
  FolderChatMessage,
  LetterItem,
  ActivityItem,
} from '@/types/folder';
import { Organization } from '@/types/organization';
import { Address } from '@/types/address';
import { Person } from '@/types/person';
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

  // Organizations
  addOrganization: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  addOrganizationToFolder: (folderId: string, org: Organization) => Promise<void>;
  removeOrganization: (folderId: string, itemId: string) => Promise<void>;

  // Addresses
  addAddress: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  addAddressToFolder: (folderId: string, address: Address) => Promise<void>;
  removeAddress: (folderId: string, itemId: string) => Promise<void>;

  // People Involved
  addPersonToFolder: (folderId: string, person: Person) => Promise<void>;
  removePersonInvolved: (folderId: string, personId: string) => Promise<void>;

  // Letters
  addLetter: (folderId: string, item: Pick<LetterItem, 'name' | 'template' | 'description' | 'tags'>) => Promise<LetterItem | undefined>;
  updateLetter: (folderId: string, letterId: string, data: Partial<Pick<LetterItem, 'description' | 'tags' | 'fieldData'>>) => Promise<void>;
  removeLetter: (folderId: string, itemId: string) => Promise<void>;

  // Findings
  addFinding: (folderId: string, item: Omit<FindingItem, 'id'>) => Promise<void>;
  removeFinding: (folderId: string, itemId: string) => Promise<void>;
  toggleFindingCompletion: (folderId: string, findingId: string) => Promise<void>;

  // Attachments (legacy FolderItem-based)
  addAttachment: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  removeAttachment: (folderId: string, itemId: string) => Promise<void>;

  // File Attachments (new with actual file content)
  addFileAttachment: (folderId: string, attachment: Omit<FolderAttachment, 'id' | 'uploadedAt'>) => Promise<void>;
  updateFileAttachment: (folderId: string, attachmentId: string, data: Partial<Pick<FolderAttachment, 'description' | 'tags'>>) => Promise<void>;
  removeFileAttachment: (folderId: string, attachmentId: string) => Promise<void>;

  // Records
  addRecord: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  removeRecord: (folderId: string, itemId: string) => Promise<void>;

  // Communications
  addCommunication: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  removeCommunication: (folderId: string, itemId: string) => Promise<void>;

  // Chat Messages
  addChatMessage: (folderId: string, message: Omit<FolderChatMessage, 'id' | 'createdAt'>) => Promise<void>;

  // Suggestions
  addSuggestion: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  removeSuggestion: (folderId: string, itemId: string) => Promise<void>;

  // Visualizations
  addVisualization: (folderId: string, item: Omit<FolderItem, 'id'>) => Promise<void>;
  removeVisualization: (folderId: string, itemId: string) => Promise<void>;

  // Activities
  addActivity: (folderId: string, item: Omit<ActivityItem, 'id' | 'createdByName' | 'updatedAt'>) => Promise<void>;
  removeActivity: (folderId: string, itemId: string) => Promise<void>;

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
    // Fetch the latest folder state from the API to avoid race conditions
    const getResponse = await fetch(`/api/folders/${folderId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch folder');
    }
    const latestFolder = await getResponse.json();

    // Check if practitioner already exists
    if ((latestFolder.practitioners || []).some((p: { userId: string }) => p.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: [...(latestFolder.practitioners || []), { userId, userName, addedAt: now }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add practitioner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  const removePractitioner = useCallback(async (folderId: string, userId: string) => {
    // Fetch the latest folder state from the API to avoid race conditions
    const getResponse = await fetch(`/api/folders/${folderId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch folder');
    }
    const latestFolder = await getResponse.json();

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: (latestFolder.practitioners || []).filter((p: { userId: string }) => p.userId !== userId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove practitioner');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  // Sharing
  const shareFolder = useCallback(async (folderId: string, userId: string, userName: string, accessLevel: FolderAccessLevel) => {
    // Fetch the latest folder state from the API to avoid race conditions
    const getResponse = await fetch(`/api/folders/${folderId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch folder');
    }
    const latestFolder = await getResponse.json();

    // Check if already shared with this user
    if ((latestFolder.sharedWith || []).some((s: { userId: string }) => s.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: [
          ...(latestFolder.sharedWith || []),
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
  }, [currentUser]);

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
    // Fetch the latest folder state from the API to avoid race conditions
    const getResponse = await fetch(`/api/folders/${folderId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch folder');
    }
    const latestFolder = await getResponse.json();

    // Check if tag already exists
    if ((latestFolder.tags || []).includes(tag)) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: [...(latestFolder.tags || []), tag],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add tag');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  const removeTag = useCallback(async (folderId: string, tag: string) => {
    // Fetch the latest folder state from the API to avoid race conditions
    const getResponse = await fetch(`/api/folders/${folderId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch folder');
    }
    const latestFolder = await getResponse.json();

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: (latestFolder.tags || []).filter((t: string) => t !== tag),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove tag');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, []);

  // Organizations
  const addOrganization = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: [...(folder.organizations || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add organization');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const addOrganizationToFolder = useCallback(async (folderId: string, org: Organization) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Check if organization is already in the folder
    if ((folder.organizations || []).some((o) => o.id === org.id)) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: [...(folder.organizations || []), org],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add organization to folder');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeOrganization = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: (folder.organizations || []).filter((o) => o.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove organization');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Addresses
  const addAddress = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [...(folder.addresses || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add address');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const addAddressToFolder = useCallback(async (folderId: string, address: Address) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Check if address is already in the folder
    if ((folder.addresses || []).some((a) => a.id === address.id)) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [...(folder.addresses || []), address],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add address to folder');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeAddress = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: (folder.addresses || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove address');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // People Involved
  const addPersonToFolder = useCallback(async (folderId: string, person: Person) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Check if person is already in the folder
    if ((folder.peopleInvolved || []).some((p) => p.id === person.id)) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peopleInvolved: [...(folder.peopleInvolved || []), person],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add person to folder');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removePersonInvolved = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peopleInvolved: (folder.peopleInvolved || []).filter((p) => p.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove person involved');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Letters
  const addLetter = useCallback(async (folderId: string, item: Pick<LetterItem, 'name' | 'template' | 'description' | 'tags'>): Promise<LetterItem | undefined> => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return undefined;

    const now = new Date().toISOString();
    const newLetter: LetterItem = {
      id: generateId(),
      name: item.name,
      template: item.template,
      description: item.description,
      tags: item.tags,
      createdBy: currentUser.id,
      createdByFirstName: currentUser.firstName,
      createdBySurname: currentUser.lastName,
      createdAt: now,
      updatedAt: now,
      fieldData: {},
    };

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: [...(folder.letters || []), newLetter],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add letter');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );

    return newLetter;
  }, [folders]);

  const updateLetter = useCallback(async (folderId: string, letterId: string, data: Partial<Pick<LetterItem, 'description' | 'tags' | 'fieldData'>>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: (folder.letters || []).map((l) =>
          l.id === letterId ? { ...l, ...data, updatedAt: now } : l
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update letter');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeLetter = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: (folder.letters || []).filter((l) => l.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove letter');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Findings
  const addFinding = useCallback(async (folderId: string, item: Omit<FindingItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FindingItem = {
      id: generateId(),
      ...item,
      isCompleted: item.isCompleted ?? false,
      totalSteps: item.totalSteps ?? 1,
      completedSteps: item.completedSteps ?? 0,
    };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: [...(folder.findings || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add finding');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeFinding = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: (folder.findings || []).filter((f) => f.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove finding');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const toggleFindingCompletion = useCallback(async (folderId: string, findingId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const updatedFindings = (folder.findings || []).map((finding) => {
      if (finding.id === findingId) {
        const totalSteps = finding.totalSteps ?? 1;
        const currentCompleted = finding.completedSteps ?? 0;
        const newCompletedSteps = currentCompleted >= totalSteps ? 0 : totalSteps;
        return {
          ...finding,
          completedSteps: newCompletedSteps,
          isCompleted: newCompletedSteps >= totalSteps,
        };
      }
      return finding;
    });

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: updatedFindings,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle finding completion');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Attachments
  const addAttachment = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [...(folder.attachments || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add attachment');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeAttachment = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: (folder.attachments || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove attachment');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // File Attachments (new with actual file content)
  const addFileAttachment = useCallback(async (folderId: string, attachment: Omit<FolderAttachment, 'id' | 'uploadedAt'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const newAttachment: FolderAttachment = {
      id: generateId(),
      ...attachment,
      uploadedAt: now,
    };

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: [...(folder.fileAttachments || []), newAttachment],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add file attachment');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const updateFileAttachment = useCallback(async (folderId: string, attachmentId: string, data: Partial<Pick<FolderAttachment, 'description' | 'tags'>>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: (folder.fileAttachments || []).map((a) =>
          a.id === attachmentId ? { ...a, ...data } : a
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file attachment');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeFileAttachment = useCallback(async (folderId: string, attachmentId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: (folder.fileAttachments || []).filter((a) => a.id !== attachmentId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove file attachment');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Records
  const addRecord = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [...(folder.records || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add record');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeRecord = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: (folder.records || []).filter((r) => r.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove record');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Communications
  const addCommunication = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communications: [...(folder.communications || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add communication');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeCommunication = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communications: (folder.communications || []).filter((c) => c.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove communication');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Chat Messages
  const addChatMessage = useCallback(async (folderId: string, message: Omit<FolderChatMessage, 'id' | 'createdAt'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const newMessage: FolderChatMessage = {
      id: generateId(),
      ...message,
      createdAt: now,
    };

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatMessages: [...(folder.chatMessages || []), newMessage],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add chat message');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Suggestions
  const addSuggestion = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestions: [...(folder.suggestions || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add suggestion');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeSuggestion = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestions: (folder.suggestions || []).filter((s) => s.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove suggestion');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Visualizations
  const addVisualization = useCallback(async (folderId: string, item: Omit<FolderItem, 'id'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newItem: FolderItem = { id: generateId(), ...item };
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visualizations: [...(folder.visualizations || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add visualization');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeVisualization = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visualizations: (folder.visualizations || []).filter((v) => v.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove visualization');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  // Activities
  const addActivity = useCallback(async (folderId: string, item: Omit<ActivityItem, 'id' | 'createdByName' | 'updatedAt'>) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const now = new Date().toISOString();
    const newItem: ActivityItem = {
      id: generateId(),
      ...item,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      updatedAt: now,
    };

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activities: [...(folder.activities || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add activity');
    }

    const updatedFolder = await response.json();
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? updatedFolder : f))
    );
  }, [folders]);

  const removeActivity = useCallback(async (folderId: string, itemId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activities: (folder.activities || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove activity');
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
    addOrganization,
    addOrganizationToFolder,
    removeOrganization,
    addAddress,
    addAddressToFolder,
    removeAddress,
    addPersonToFolder,
    removePersonInvolved,
    addLetter,
    updateLetter,
    removeLetter,
    addFinding,
    removeFinding,
    toggleFindingCompletion,
    addAttachment,
    removeAttachment,
    addFileAttachment,
    updateFileAttachment,
    removeFileAttachment,
    addRecord,
    removeRecord,
    addCommunication,
    removeCommunication,
    addChatMessage,
    addSuggestion,
    removeSuggestion,
    addVisualization,
    removeVisualization,
    addActivity,
    removeActivity,
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
