'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Case,
  CaseFilters,
  CreateCaseInput,
  UpdateCaseInput,
  CaseStats,
  CaseStatus,
  CaseAccessLevel,
  CaseNote,
  ApplicationData,
  CaseItem,
  FindingItem,
  CaseAttachment,
  CaseChatMessage,
  LetterItem,
  ActivityItem,
} from '@/types/case';
import { Organization } from '@/types/organization';
import { Address } from '@/types/address';
import { Person } from '@/types/person';
import { currentUser } from '@/data/mock-users';
import { generateId } from '@/lib/utils';
import { useSignals } from './signal-context';

interface CaseContextValue {
  cases: Case[];
  filteredCases: Case[];
  selectedCase: Case | null;
  filters: CaseFilters;
  searchQuery: string;
  caseStats: CaseStats;
  isLoading: boolean;

  // Case CRUD
  createCase: (data: CreateCaseInput) => Promise<Case>;
  createCaseFromSignals: (name: string, description: string, signalIds: string[]) => Promise<Case>;
  updateCase: (id: string, data: UpdateCaseInput) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  getCaseById: (id: string) => Case | undefined;
  refreshCases: () => Promise<void>;

  // Ownership
  assignCaseOwner: (caseId: string, userId: string, userName: string) => Promise<void>;
  unassignCaseOwner: (caseId: string) => Promise<void>;

  // Status
  updateCaseStatus: (caseId: string, status: CaseStatus) => Promise<void>;
  getCasesByStatus: (status: CaseStatus) => Case[];

  // Notes
  addCaseNote: (caseId: string, content: string, isAdminNote: boolean) => Promise<void>;
  removeCaseNote: (caseId: string, noteId: string) => Promise<void>;

  // Practitioners
  addPractitioner: (caseId: string, userId: string, userName: string) => Promise<void>;
  removePractitioner: (caseId: string, userId: string) => Promise<void>;

  // Sharing
  shareCase: (caseId: string, userId: string, userName: string, accessLevel: CaseAccessLevel) => Promise<void>;
  updateShareAccess: (caseId: string, userId: string, accessLevel: CaseAccessLevel) => Promise<void>;
  removeShare: (caseId: string, userId: string) => Promise<void>;

  // Tags
  addTag: (caseId: string, tag: string) => Promise<void>;
  removeTag: (caseId: string, tag: string) => Promise<void>;

  // Organizations
  addOrganization: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  addOrganizationToCase: (caseId: string, org: Organization) => Promise<void>;
  removeOrganization: (caseId: string, itemId: string) => Promise<void>;

  // Addresses
  addAddress: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  addAddressToCase: (caseId: string, address: Address) => Promise<void>;
  removeAddress: (caseId: string, itemId: string) => Promise<void>;

  // People Involved
  addPersonToCase: (caseId: string, person: Person) => Promise<void>;
  removePersonInvolved: (caseId: string, personId: string) => Promise<void>;

  // Letters
  addLetter: (caseId: string, item: Pick<LetterItem, 'name' | 'template' | 'description' | 'tags'>) => Promise<LetterItem | undefined>;
  updateLetter: (caseId: string, letterId: string, data: Partial<Pick<LetterItem, 'description' | 'tags' | 'fieldData'>>) => Promise<void>;
  removeLetter: (caseId: string, itemId: string) => Promise<void>;

  // Findings
  addFinding: (caseId: string, item: Omit<FindingItem, 'id'>) => Promise<void>;
  removeFinding: (caseId: string, itemId: string) => Promise<void>;
  toggleFindingCompletion: (caseId: string, findingId: string) => Promise<void>;

  // Attachments (legacy CaseItem-based)
  addAttachment: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  removeAttachment: (caseId: string, itemId: string) => Promise<void>;

  // File Attachments (new with actual file content)
  addFileAttachment: (caseId: string, attachment: Omit<CaseAttachment, 'id' | 'uploadedAt'>) => Promise<void>;
  updateFileAttachment: (caseId: string, attachmentId: string, data: Partial<Pick<CaseAttachment, 'description' | 'tags'>>) => Promise<void>;
  removeFileAttachment: (caseId: string, attachmentId: string) => Promise<void>;

  // Records
  addRecord: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  removeRecord: (caseId: string, itemId: string) => Promise<void>;

  // Communications
  addCommunication: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  removeCommunication: (caseId: string, itemId: string) => Promise<void>;

  // Chat Messages
  addChatMessage: (caseId: string, message: Omit<CaseChatMessage, 'id' | 'createdAt'>) => Promise<void>;

  // Suggestions
  addSuggestion: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  removeSuggestion: (caseId: string, itemId: string) => Promise<void>;

  // Visualizations
  addVisualization: (caseId: string, item: Omit<CaseItem, 'id'>) => Promise<void>;
  removeVisualization: (caseId: string, itemId: string) => Promise<void>;

  // Activities
  addActivity: (caseId: string, item: Omit<ActivityItem, 'id' | 'createdByName' | 'updatedAt'>) => Promise<void>;
  removeActivity: (caseId: string, itemId: string) => Promise<void>;

  // Location
  updateLocation: (caseId: string, location: string) => Promise<void>;

  // Application
  updateApplicationData: (caseId: string, data: Partial<ApplicationData>) => Promise<void>;
  completeApplication: (caseId: string) => Promise<void>;

  // Computed
  getSignalCountForCase: (caseId: string) => number;

  // Filter Actions
  setFilters: (filters: Partial<CaseFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCase: (caseItem: Case | null) => void;
}

const defaultFilters: CaseFilters = {
  ownerId: [],
};

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [filters, setFiltersState] = useState<CaseFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { signals, addSignalsToCase } = useSignals();

  // Fetch cases from API on mount
  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const refreshCases = useCallback(async () => {
    await fetchCases();
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    let result = [...cases];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          (c.ownerName && c.ownerName.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.ownerId.length > 0) {
      result = result.filter((c) => c.ownerId && filters.ownerId.includes(c.ownerId));
    }

    // Sort by updated date
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return result;
  }, [cases, filters, searchQuery]);

  const caseStats = useMemo((): CaseStats => {
    const casesWithSignals = cases.filter((c) =>
      signals.some((s) => s.caseRelations.some(cr => cr.caseId === c.id))
    );

    return {
      total: cases.length,
      withSignals: casesWithSignals.length,
      empty: cases.length - casesWithSignals.length,
    };
  }, [cases, signals]);

  const getSignalCountForCase = useCallback((caseId: string): number => {
    return signals.filter((s) => s.caseRelations.some(cr => cr.caseId === caseId)).length;
  }, [signals]);

  const createCase = useCallback(async (data: CreateCaseInput): Promise<Case> => {
    const response = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create case');
    }

    const newCase = await response.json();
    setCases((prev) => [newCase, ...prev]);

    // If signalIds provided, add signals to case
    if (data.signalIds && data.signalIds.length > 0) {
      await addSignalsToCase(data.signalIds, newCase.id);
    }

    return newCase;
  }, [addSignalsToCase]);

  const createCaseFromSignals = useCallback(async (name: string, description: string, signalIds: string[]): Promise<Case> => {
    return createCase({
      name,
      description,
      signalIds,
    });
  }, [createCase]);

  const updateCase = useCallback(async (id: string, data: UpdateCaseInput) => {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update case');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === id ? updatedCase : c))
    );
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    const response = await fetch(`/api/cases/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete case');
    }

    setCases((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCaseById = useCallback((id: string): Case | undefined => {
    return cases.find((c) => c.id === id);
  }, [cases]);

  const assignCaseOwner = useCallback(async (caseId: string, userId: string, userName: string) => {
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: userId,
        ownerName: userName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign case owner');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  const unassignCaseOwner = useCallback(async (caseId: string) => {
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: null,
        ownerName: null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to unassign case owner');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  const updateCaseStatus = useCallback(async (caseId: string, status: CaseStatus) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        statusDates: {
          ...caseItem.statusDates,
          [status]: now,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update case status');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const getCasesByStatus = useCallback((status: CaseStatus): Case[] => {
    return cases.filter((c) => c.status === status);
  }, [cases]);

  // Notes
  const addCaseNote = useCallback(async (caseId: string, content: string, isAdminNote: boolean) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const now = new Date().toISOString();
    const newNote: CaseNote = {
      id: generateId(),
      content,
      createdAt: now,
      createdBy: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      isAdminNote,
    };

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: [...(caseItem.notes || []), newNote],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add case note');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeCaseNote = useCallback(async (caseId: string, noteId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: (caseItem.notes || []).filter((n) => n.id !== noteId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove case note');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Practitioners
  const addPractitioner = useCallback(async (caseId: string, userId: string, userName: string) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    // Check if practitioner already exists
    if ((latestCase.practitioners || []).some((p: { userId: string }) => p.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: [...(latestCase.practitioners || []), { userId, userName, addedAt: now }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add practitioner');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  const removePractitioner = useCallback(async (caseId: string, userId: string) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        practitioners: (latestCase.practitioners || []).filter((p: { userId: string }) => p.userId !== userId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove practitioner');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  // Sharing
  const shareCase = useCallback(async (caseId: string, userId: string, userName: string, accessLevel: CaseAccessLevel) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    // Check if already shared with this user
    if ((latestCase.sharedWith || []).some((s: { userId: string }) => s.userId === userId)) return;

    const now = new Date().toISOString();
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: [
          ...(latestCase.sharedWith || []),
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
      throw new Error('Failed to share case');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [currentUser]);

  const updateShareAccess = useCallback(async (caseId: string, userId: string, accessLevel: CaseAccessLevel) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: (caseItem.sharedWith || []).map((s) =>
          s.userId === userId ? { ...s, accessLevel } : s
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update share access');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeShare = useCallback(async (caseId: string, userId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedWith: (caseItem.sharedWith || []).filter((s) => s.userId !== userId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove share');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Tags
  const addTag = useCallback(async (caseId: string, tag: string) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    // Check if tag already exists
    if ((latestCase.tags || []).includes(tag)) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: [...(latestCase.tags || []), tag],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add tag');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  const removeTag = useCallback(async (caseId: string, tag: string) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tags: (latestCase.tags || []).filter((t: string) => t !== tag),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove tag');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  // Organizations
  const addOrganization = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: [...(caseItem.organizations || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add organization');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const addOrganizationToCase = useCallback(async (caseId: string, org: Organization) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    // Check if organization is already in the case
    if ((caseItem.organizations || []).some((o) => o.id === org.id)) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: [...(caseItem.organizations || []), org],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add organization to case');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeOrganization = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizations: (caseItem.organizations || []).filter((o) => o.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove organization');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Addresses
  const addAddress = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [...(caseItem.addresses || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add address');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const addAddressToCase = useCallback(async (caseId: string, address: Address) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    // Check if address is already in the case
    if ((caseItem.addresses || []).some((a) => a.id === address.id)) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [...(caseItem.addresses || []), address],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add address to case');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeAddress = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: (caseItem.addresses || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove address');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // People Involved
  const addPersonToCase = useCallback(async (caseId: string, person: Person) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    // Check if person is already in the case
    if ((caseItem.peopleInvolved || []).some((p) => p.id === person.id)) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peopleInvolved: [...(caseItem.peopleInvolved || []), person],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add person to case');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removePersonInvolved = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peopleInvolved: (caseItem.peopleInvolved || []).filter((p) => p.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove person involved');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Letters
  const addLetter = useCallback(async (caseId: string, item: Pick<LetterItem, 'name' | 'template' | 'description' | 'tags'>): Promise<LetterItem | undefined> => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return undefined;

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

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: [...(caseItem.letters || []), newLetter],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add letter');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );

    return newLetter;
  }, [cases]);

  const updateLetter = useCallback(async (caseId: string, letterId: string, data: Partial<Pick<LetterItem, 'description' | 'tags' | 'fieldData'>>) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    const now = new Date().toISOString();
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: (latestCase.letters || []).map((l: LetterItem) =>
          l.id === letterId ? { ...l, ...data, updatedAt: now } : l
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update letter');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeLetter = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: (caseItem.letters || []).filter((l) => l.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove letter');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Findings
  const addFinding = useCallback(async (caseId: string, item: Omit<FindingItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: FindingItem = {
      id: generateId(),
      ...item,
      isCompleted: item.isCompleted ?? false,
      totalSteps: item.totalSteps ?? 1,
      completedSteps: item.completedSteps ?? 0,
    };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: [...(caseItem.findings || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add finding');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeFinding = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: (caseItem.findings || []).filter((f) => f.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove finding');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const toggleFindingCompletion = useCallback(async (caseId: string, findingId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const updatedFindings = (caseItem.findings || []).map((finding) => {
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

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findings: updatedFindings,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle finding completion');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Attachments
  const addAttachment = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [...(caseItem.attachments || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add attachment');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeAttachment = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: (caseItem.attachments || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove attachment');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // File Attachments (new with actual file content)
  const addFileAttachment = useCallback(async (caseId: string, attachment: Omit<CaseAttachment, 'id' | 'uploadedAt'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const now = new Date().toISOString();
    const newAttachment: CaseAttachment = {
      id: generateId(),
      ...attachment,
      uploadedAt: now,
    };

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: [...(caseItem.fileAttachments || []), newAttachment],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add file attachment');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const updateFileAttachment = useCallback(async (caseId: string, attachmentId: string, data: Partial<Pick<CaseAttachment, 'description' | 'tags'>>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: (caseItem.fileAttachments || []).map((a) =>
          a.id === attachmentId ? { ...a, ...data } : a
        ),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file attachment');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeFileAttachment = useCallback(async (caseId: string, attachmentId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileAttachments: (caseItem.fileAttachments || []).filter((a) => a.id !== attachmentId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove file attachment');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Records
  const addRecord = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [...(caseItem.records || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add record');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeRecord = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: (caseItem.records || []).filter((r) => r.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove record');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Communications
  const addCommunication = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communications: [...(caseItem.communications || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add communication');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeCommunication = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communications: (caseItem.communications || []).filter((c) => c.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove communication');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Chat Messages
  const addChatMessage = useCallback(async (caseId: string, message: Omit<CaseChatMessage, 'id' | 'createdAt'>) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    const now = new Date().toISOString();
    const newMessage: CaseChatMessage = {
      id: generateId(),
      ...message,
      createdAt: now,
    };

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatMessages: [...(latestCase.chatMessages || []), newMessage],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add chat message');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Suggestions
  const addSuggestion = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestions: [...(caseItem.suggestions || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add suggestion');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeSuggestion = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestions: (caseItem.suggestions || []).filter((s) => s.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove suggestion');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Visualizations
  const addVisualization = useCallback(async (caseId: string, item: Omit<CaseItem, 'id'>) => {
    // Fetch the latest case state from the API to avoid race conditions
    const getResponse = await fetch(`/api/cases/${caseId}`);
    if (!getResponse.ok) {
      throw new Error('Failed to fetch case');
    }
    const latestCase = await getResponse.json();

    const newItem: CaseItem = { id: generateId(), ...item };
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visualizations: [...(latestCase.visualizations || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add visualization');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeVisualization = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visualizations: (caseItem.visualizations || []).filter((v) => v.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove visualization');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Activities
  const addActivity = useCallback(async (caseId: string, item: Omit<ActivityItem, 'id' | 'createdByName' | 'updatedAt'>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const now = new Date().toISOString();
    const newItem: ActivityItem = {
      id: generateId(),
      ...item,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      updatedAt: now,
    };

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activities: [...(caseItem.activities || []), newItem],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add activity');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const removeActivity = useCallback(async (caseId: string, itemId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activities: (caseItem.activities || []).filter((a) => a.id !== itemId),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove activity');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  // Location
  const updateLocation = useCallback(async (caseId: string, location: string) => {
    const response = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) {
      throw new Error('Failed to update location');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  // Application
  const updateApplicationData = useCallback(async (caseId: string, data: Partial<ApplicationData>) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    const response = await fetch(`/api/cases/${caseId}/application`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationData: data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update application data');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, [cases]);

  const completeApplication = useCallback(async (caseId: string) => {
    const response = await fetch(`/api/cases/${caseId}/application`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complete: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete application');
    }

    const updatedCase = await response.json();
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? updatedCase : c))
    );
  }, []);

  const setFilters = useCallback((newFilters: Partial<CaseFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchQuery('');
  }, []);

  const value: CaseContextValue = {
    cases,
    filteredCases,
    selectedCase,
    filters,
    searchQuery,
    caseStats,
    isLoading,
    createCase,
    createCaseFromSignals,
    updateCase,
    deleteCase,
    getCaseById,
    refreshCases,
    assignCaseOwner,
    unassignCaseOwner,
    updateCaseStatus,
    getCasesByStatus,
    addCaseNote,
    removeCaseNote,
    addPractitioner,
    removePractitioner,
    shareCase,
    updateShareAccess,
    removeShare,
    addTag,
    removeTag,
    addOrganization,
    addOrganizationToCase,
    removeOrganization,
    addAddress,
    addAddressToCase,
    removeAddress,
    addPersonToCase,
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
    getSignalCountForCase,
    setFilters,
    clearFilters,
    setSearchQuery,
    setSelectedCase,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCases(): CaseContextValue {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }
  return context;
}
