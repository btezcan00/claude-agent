'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
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
  SignalFolderRelation,
} from '@/types/signal';

interface SignalStats {
  total: number;
}
import { ViewMode } from '@/types/common';
import { mockSignals } from '@/data/mock-signals';
import { currentUser } from '@/data/mock-users';
import { generateId, generateSignalNumber } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

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

  // Signal Actions
  createSignal: (data: CreateSignalInput) => Signal;
  updateSignal: (id: string, data: UpdateSignalInput) => void;
  deleteSignal: (id: string) => void;
  getSignalById: (id: string) => Signal | undefined;
  getSignalsByFolderId: (folderId: string) => Signal[];

  // Notes Actions
  addNote: (signalId: string, content: string, isPrivate?: boolean) => void;

  // Photo Actions
  addPhoto: (signalId: string, photo: Omit<SignalPhoto, 'id' | 'signalId' | 'uploadedAt'>) => void;
  removePhoto: (signalId: string, photoId: string) => void;

  // Attachment Actions
  addAttachment: (signalId: string, attachment: Omit<SignalAttachment, 'id' | 'signalId' | 'uploadedAt'>) => void;
  removeAttachment: (signalId: string, attachmentId: string) => void;

  // Indicator Actions
  updateIndicators: (signalId: string, indicators: SignalIndicator[]) => void;

  // Folder Actions
  addSignalToFolder: (signalId: string, folderId: string) => void;
  removeSignalFromFolder: (signalId: string, folderId: string) => void;
  addSignalsToFolder: (signalIds: string[], folderId: string) => void;
  updateSignalFolderRelation: (signalId: string, folderId: string, relation: string) => void;
  getSignalFolderRelation: (signalId: string, folderId: string) => SignalFolderRelation | undefined;

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
  folderId: [],
};

const defaultSortOption: SortOption = {
  field: 'createdAt',
  order: 'desc',
};

const SignalContext = createContext<SignalContextValue | null>(null);

export function SignalProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useLocalStorage<Signal[]>('gcmp-signals', mockSignals);
  const [filters, setFiltersState] = useState<SignalFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(defaultSortOption);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filteredSignals = useMemo(() => {
    if (!isHydrated) return [];

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
    if (filters.folderId.length > 0) {
      result = result.filter((s) => s.folderRelations.some((fr) => filters.folderId.includes(fr.folderId)));
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
  }, [signals, filters, searchQuery, sortOption, isHydrated]);

  const signalStats = useMemo((): SignalStats => {
    if (!isHydrated) return { total: 0 };

    return {
      total: signals.length,
    };
  }, [signals, isHydrated]);

  const createSignal = useCallback((data: CreateSignalInput): Signal => {
    const now = new Date().toISOString();
    const newSignal: Signal = {
      id: generateId(),
      signalNumber: generateSignalNumber(),
      description: data.description,
      types: data.types,
      placeOfObservation: data.placeOfObservation,
      locationDescription: data.locationDescription,
      timeOfObservation: data.timeOfObservation,
      receivedBy: data.receivedBy,
      contactPerson: data.contactPerson,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: now,
      updatedAt: now,
      folderRelations: (data.folderIds || []).map(folderId => ({ folderId })),
      notes: [],
      activities: [
        {
          id: generateId(),
          signalId: '',
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'signal-created',
          details: 'Signal created',
          timestamp: now,
        },
      ],
      photos: [],
      attachments: [],
      tags: [],
      indicators: [],
    };
    newSignal.activities[0].signalId = newSignal.id;

    setSignals((prev) => [newSignal, ...prev]);
    return newSignal;
  }, [setSignals]);

  const updateSignal = useCallback((id: string, data: UpdateSignalInput) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        const updatedSignal = { ...s, ...data, updatedAt: now };

        const activity: ActivityEntry = {
          id: generateId(),
          signalId: id,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'signal-updated',
          details: 'Signal details updated',
          timestamp: now,
        };
        updatedSignal.activities = [activity, ...s.activities];

        return updatedSignal;
      })
    );
  }, [setSignals]);

  const deleteSignal = useCallback((id: string) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  }, [setSignals]);

  const getSignalById = useCallback((id: string): Signal | undefined => {
    return signals.find((s) => s.id === id);
  }, [signals]);

  const getSignalsByFolderId = useCallback((folderId: string): Signal[] => {
    return signals.filter((s) => s.folderRelations.some(fr => fr.folderId === folderId));
  }, [signals]);

  const addNote = useCallback((signalId: string, content: string, isPrivate: boolean = false) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

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

        return {
          ...s,
          updatedAt: now,
          notes: [note, ...s.notes],
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const addPhoto = useCallback((
    signalId: string,
    photo: Omit<SignalPhoto, 'id' | 'signalId' | 'uploadedAt'>
  ) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

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

        return {
          ...s,
          updatedAt: now,
          photos: [...s.photos, newPhoto],
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const removePhoto = useCallback((signalId: string, photoId: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

        const photo = s.photos.find(p => p.id === photoId);
        if (!photo) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'photo-removed',
          details: `Removed photo: ${photo.fileName}`,
          timestamp: now,
        };

        return {
          ...s,
          updatedAt: now,
          photos: s.photos.filter(p => p.id !== photoId),
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const addAttachment = useCallback((
    signalId: string,
    attachment: Omit<SignalAttachment, 'id' | 'signalId' | 'uploadedAt'>
  ) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

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

        return {
          ...s,
          updatedAt: now,
          attachments: [...s.attachments, newAttachment],
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const removeAttachment = useCallback((signalId: string, attachmentId: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

        const attachment = s.attachments.find(a => a.id === attachmentId);
        if (!attachment) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'attachment-removed',
          details: `Removed attachment: ${attachment.fileName}`,
          timestamp: now,
        };

        return {
          ...s,
          updatedAt: now,
          attachments: s.attachments.filter(a => a.id !== attachmentId),
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const updateIndicators = useCallback((signalId: string, indicators: SignalIndicator[]) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'signal-updated',
          details: 'Updated indicators',
          timestamp: now,
        };

        return {
          ...s,
          indicators,
          updatedAt: now,
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const addSignalToFolder = useCallback((signalId: string, folderId: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;
        if (s.folderRelations.some(fr => fr.folderId === folderId)) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'folder-added',
          details: 'Added to folder',
          timestamp: now,
        };

        return {
          ...s,
          folderRelations: [...s.folderRelations, { folderId }],
          updatedAt: now,
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const removeSignalFromFolder = useCallback((signalId: string, folderId: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;
        if (!s.folderRelations.some(fr => fr.folderId === folderId)) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'folder-removed',
          details: 'Removed from folder',
          timestamp: now,
        };

        return {
          ...s,
          folderRelations: s.folderRelations.filter((fr) => fr.folderId !== folderId),
          updatedAt: now,
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const addSignalsToFolder = useCallback((signalIds: string[], folderId: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (!signalIds.includes(s.id)) return s;
        if (s.folderRelations.some(fr => fr.folderId === folderId)) return s;

        const activity: ActivityEntry = {
          id: generateId(),
          signalId: s.id,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'folder-added',
          details: 'Added to folder',
          timestamp: now,
        };

        return {
          ...s,
          folderRelations: [...s.folderRelations, { folderId }],
          updatedAt: now,
          activities: [activity, ...s.activities],
        };
      })
    );
  }, [setSignals]);

  const updateSignalFolderRelation = useCallback((signalId: string, folderId: string, relation: string) => {
    const now = new Date().toISOString();
    setSignals((prev) =>
      prev.map((s) => {
        if (s.id !== signalId) return s;
        const relationIndex = s.folderRelations.findIndex(fr => fr.folderId === folderId);
        if (relationIndex === -1) return s;

        const updatedRelations = [...s.folderRelations];
        updatedRelations[relationIndex] = { ...updatedRelations[relationIndex], relation };

        return {
          ...s,
          folderRelations: updatedRelations,
          updatedAt: now,
        };
      })
    );
  }, [setSignals]);

  const getSignalFolderRelation = useCallback((signalId: string, folderId: string): SignalFolderRelation | undefined => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return undefined;
    return signal.folderRelations.find(fr => fr.folderId === folderId);
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
    createSignal,
    updateSignal,
    deleteSignal,
    getSignalById,
    getSignalsByFolderId,
    addNote,
    addPhoto,
    removePhoto,
    addAttachment,
    removeAttachment,
    updateIndicators,
    addSignalToFolder,
    removeSignalFromFolder,
    addSignalsToFolder,
    updateSignalFolderRelation,
    getSignalFolderRelation,
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
