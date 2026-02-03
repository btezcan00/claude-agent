'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Signal,
  SignalFilters,
  SortOption,
  CreateSignalInput,
  UpdateSignalInput,
  SignalNote,
  SignalAttachment,
  SignalPhoto,
  ActivityEntry,
  SignalIndicator,
  SignalCaseRelation,
} from '@/types/signal';

interface SignalStats {
  total: number;
}
import { ViewMode } from '@/types/common';
import { generateId } from '@/lib/utils';
import { useUsers } from './user-context';

interface SignalContextValue {
  signals: Signal[];
  filteredSignals: Signal[];
  selectedSignal: Signal | null;
  selectedSignalIds: string[];
  filters: SignalFilters;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  signalStats: SignalStats;
  isLoading: boolean;

  // Signal Actions
  createSignal: (data: CreateSignalInput) => Promise<Signal>;
  updateSignal: (id: string, data: UpdateSignalInput) => Promise<void>;
  deleteSignal: (id: string) => Promise<void>;
  getSignalById: (id: string) => Signal | undefined;
  getSignalsByCaseId: (caseId: string) => Signal[];
  refreshSignals: () => Promise<void>;

  // Notes Actions
  addNote: (signalId: string, content: string, isPrivate?: boolean) => Promise<void>;

  // Photo Actions
  addPhoto: (signalId: string, photo: Omit<SignalPhoto, 'id' | 'signalId' | 'uploadedAt'>) => Promise<void>;
  removePhoto: (signalId: string, photoId: string) => Promise<void>;

  // Attachment Actions
  addAttachment: (signalId: string, attachment: Omit<SignalAttachment, 'id' | 'signalId' | 'uploadedAt'>) => Promise<void>;
  removeAttachment: (signalId: string, attachmentId: string) => Promise<void>;

  // Indicator Actions
  updateIndicators: (signalId: string, indicators: SignalIndicator[]) => Promise<void>;

  // Case Actions
  addSignalToCase: (signalId: string, caseId: string) => Promise<void>;
  removeSignalFromCase: (signalId: string, caseId: string) => Promise<void>;
  addSignalsToCase: (signalIds: string[], caseId: string) => Promise<void>;
  updateSignalCaseRelation: (signalId: string, caseId: string, relation: string) => Promise<void>;
  getSignalCaseRelation: (signalId: string, caseId: string) => SignalCaseRelation | undefined;

  // Selection Actions
  toggleSignalSelection: (signalId: string) => void;
  selectAllSignals: () => void;
  clearSignalSelection: () => void;

  // Filter Actions
  setFilters: (filters: Partial<SignalFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedSignal: (signal: Signal | null) => void;
}

const defaultFilters: SignalFilters = {
  type: [],
  receivedBy: [],
  caseId: [],
};

const defaultSortOption: SortOption = {
  field: 'createdAt',
  order: 'desc',
};

const SignalContext = createContext<SignalContextValue | null>(null);

export function SignalProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filters, setFiltersState] = useState<SignalFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(defaultSortOption);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currentUser } = useUsers();

  // Synchronous cache for immediately available signal lookups (bypasses React state timing)
  const signalCacheRef = useRef<Map<string, Signal>>(new Map());

  // Fetch signals from API on mount
  const fetchSignals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/signals');
      if (response.ok) {
        const fetchedSignals = await response.json();
        setSignals(fetchedSignals);
        // Sync cache with fetched signals
        signalCacheRef.current.clear();
        fetchedSignals.forEach((s: Signal) => signalCacheRef.current.set(s.id, s));
      }
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const refreshSignals = useCallback(async () => {
    await fetchSignals();
  }, [fetchSignals]);

  const filteredSignals = useMemo(() => {
    let result = [...signals];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.signalNumber.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.placeOfObservation.toLowerCase().includes(query) ||
          (s.locationDescription && s.locationDescription.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.type.length > 0) {
      result = result.filter((s) => s.types.some(t => filters.type.includes(t)));
    }
    if (filters.receivedBy.length > 0) {
      result = result.filter((s) => filters.receivedBy.includes(s.receivedBy));
    }
    if (filters.caseId.length > 0) {
      result = result.filter((s) => s.caseRelations.some((cr) => filters.caseId.includes(cr.caseId)));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortOption.field) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'timeOfObservation':
          comparison = new Date(a.timeOfObservation).getTime() - new Date(b.timeOfObservation).getTime();
          break;
      }
      return sortOption.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [signals, filters, searchQuery, sortOption]);

  const signalStats = useMemo((): SignalStats => {
    return {
      total: signals.length,
    };
  }, [signals]);

  const createSignal = useCallback(async (data: CreateSignalInput): Promise<Signal> => {
    const response = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create signal');
    }

    const newSignal = await response.json();
    // Update cache synchronously for immediate availability
    signalCacheRef.current.set(newSignal.id, newSignal);
    setSignals((prev) => [newSignal, ...prev]);
    return newSignal;
  }, []);

  const updateSignal = useCallback(async (id: string, data: UpdateSignalInput) => {
    const response = await fetch(`/api/signals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update signal');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? updatedSignal : s))
    );
  }, []);

  const deleteSignal = useCallback(async (id: string) => {
    const response = await fetch(`/api/signals/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete signal');
    }

    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSignalById = useCallback((id: string): Signal | undefined => {
    // Check synchronous cache first (for newly created signals)
    const cached = signalCacheRef.current.get(id);
    if (cached) return cached;
    // Fall back to state
    return signals.find((s) => s.id === id);
  }, [signals]);

  const getSignalsByCaseId = useCallback((caseId: string): Signal[] => {
    return signals.filter((s) => s.caseRelations.some(cr => cr.caseId === caseId));
  }, [signals]);

  const addNote = useCallback(async (signalId: string, content: string, isPrivate: boolean = false) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const now = new Date().toISOString();
    const note: SignalNote = {
      id: generateId(),
      signalId,
      authorId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      content,
      createdAt: now,
      isPrivate,
    };

    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'note-added',
      details: 'Added a note',
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: [note, ...signal.notes],
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add note');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const addPhoto = useCallback(async (
    signalId: string,
    photo: Omit<SignalPhoto, 'id' | 'signalId' | 'uploadedAt'>
  ) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const now = new Date().toISOString();
    const newPhoto: SignalPhoto = {
      id: generateId(),
      signalId,
      uploadedAt: now,
      ...photo,
    };

    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'photo-added',
      details: `Added photo: ${photo.fileName}`,
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: [...signal.photos, newPhoto],
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add photo');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const removePhoto = useCallback(async (signalId: string, photoId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const photo = signal.photos.find(p => p.id === photoId);
    if (!photo) return;

    const now = new Date().toISOString();
    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'photo-removed',
      details: `Removed photo: ${photo.fileName}`,
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: signal.photos.filter(p => p.id !== photoId),
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove photo');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const addAttachment = useCallback(async (
    signalId: string,
    attachment: Omit<SignalAttachment, 'id' | 'signalId' | 'uploadedAt'>
  ) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const now = new Date().toISOString();
    const newAttachment: SignalAttachment = {
      id: generateId(),
      signalId,
      uploadedAt: now,
      ...attachment,
    };

    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'attachment-added',
      details: `Added attachment: ${attachment.fileName}`,
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [...signal.attachments, newAttachment],
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add attachment');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const removeAttachment = useCallback(async (signalId: string, attachmentId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const attachment = signal.attachments.find(a => a.id === attachmentId);
    if (!attachment) return;

    const now = new Date().toISOString();
    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'attachment-removed',
      details: `Removed attachment: ${attachment.fileName}`,
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: signal.attachments.filter(a => a.id !== attachmentId),
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove attachment');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const updateIndicators = useCallback(async (signalId: string, indicators: SignalIndicator[]) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal || !currentUser) return;

    const now = new Date().toISOString();
    const activity: ActivityEntry = {
      id: generateId(),
      signalId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'signal-updated',
      details: 'Updated indicators',
      timestamp: now,
    };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        indicators,
        activities: [activity, ...signal.activities],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update indicators');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const addSignalToCase = useCallback(async (signalId: string, caseId: string) => {
    // Don't check local state - let the API handle validation
    // This fixes race conditions where newly created signals aren't in local state yet
    const response = await fetch(`/api/signals/${signalId}/case-relations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    });

    if (!response.ok) {
      // 400 means already linked, which is fine
      if (response.status !== 400) {
        throw new Error('Failed to add signal to case');
      }
      return;
    }

    const updatedSignal = await response.json();
    setSignals((prev) => {
      const exists = prev.some(s => s.id === signalId);
      if (exists) {
        return prev.map((s) => (s.id === signalId ? updatedSignal : s));
      }
      // If signal doesn't exist in local state, add it
      return [updatedSignal, ...prev];
    });
  }, []);

  const removeSignalFromCase = useCallback(async (signalId: string, caseId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;
    if (!signal.caseRelations.some(cr => cr.caseId === caseId)) return;

    const response = await fetch(`/api/cases/${caseId}/signals/${signalId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to remove signal from case');
    }

    const data = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? data.signal : s))
    );
  }, [signals]);

  const addSignalsToCase = useCallback(async (signalIds: string[], caseId: string) => {
    // Don't check local state - let the API handle validation
    // This fixes race conditions where newly created signals aren't in local state yet
    await Promise.all(
      signalIds.map(async (signalId) => {
        const response = await fetch(`/api/signals/${signalId}/case-relations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId }),
        });
        // API returns 400 if already linked, 404 if not found - both are handled gracefully
        return response.ok ? response.json() : null;
      })
    );

    // Refresh signals to get updated case relations
    const refreshResponse = await fetch('/api/signals');
    if (refreshResponse.ok) {
      const updatedSignals = await refreshResponse.json();
      setSignals(updatedSignals);
    }
  }, []);

  const updateSignalCaseRelation = useCallback(async (signalId: string, caseId: string, relation: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    const relationIndex = signal.caseRelations.findIndex(cr => cr.caseId === caseId);
    if (relationIndex === -1) return;

    const updatedRelations = [...signal.caseRelations];
    updatedRelations[relationIndex] = { ...updatedRelations[relationIndex], relation };

    const response = await fetch(`/api/signals/${signalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseRelations: updatedRelations,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update case relation');
    }

    const updatedSignal = await response.json();
    setSignals((prev) =>
      prev.map((s) => (s.id === signalId ? updatedSignal : s))
    );
  }, [signals]);

  const getSignalCaseRelation = useCallback((signalId: string, caseId: string): SignalCaseRelation | undefined => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return undefined;
    return signal.caseRelations.find(cr => cr.caseId === caseId);
  }, [signals]);

  const toggleSignalSelection = useCallback((signalId: string) => {
    setSelectedSignalIds((prev) =>
      prev.includes(signalId)
        ? prev.filter((id) => id !== signalId)
        : [...prev, signalId]
    );
  }, []);

  const selectAllSignals = useCallback(() => {
    setSelectedSignalIds(filteredSignals.map((s) => s.id));
  }, [filteredSignals]);

  const clearSignalSelection = useCallback(() => {
    setSelectedSignalIds([]);
  }, []);

  const setFilters = useCallback((newFilters: Partial<SignalFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchQuery('');
  }, []);

  const value: SignalContextValue = {
    signals,
    filteredSignals,
    selectedSignal,
    selectedSignalIds,
    filters,
    searchQuery,
    sortOption,
    viewMode,
    signalStats,
    isLoading,
    createSignal,
    updateSignal,
    deleteSignal,
    getSignalById,
    getSignalsByCaseId,
    refreshSignals,
    addNote,
    addPhoto,
    removePhoto,
    addAttachment,
    removeAttachment,
    updateIndicators,
    addSignalToCase,
    removeSignalFromCase,
    addSignalsToCase,
    updateSignalCaseRelation,
    getSignalCaseRelation,
    toggleSignalSelection,
    selectAllSignals,
    clearSignalSelection,
    setFilters,
    clearFilters,
    setSearchQuery,
    setSortOption,
    setViewMode,
    setSelectedSignal,
  };

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}

export function useSignals(): SignalContextValue {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error('useSignals must be used within a SignalProvider');
  }
  return context;
}
