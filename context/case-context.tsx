'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Case,
  CaseFilters,
  SortOption,
  CreateCaseInput,
  UpdateCaseInput,
  CaseNote,
  CaseAttachment,
  ActivityEntry,
  CaseStatus,
} from '@/types/case';
import { ViewMode, CaseStats } from '@/types/common';
import { mockCases } from '@/data/mock-cases';
import { currentUser } from '@/data/mock-users';
import { generateId, generateCaseNumber } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface CaseContextValue {
  cases: Case[];
  filteredCases: Case[];
  selectedCase: Case | null;
  filters: CaseFilters;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  caseStats: CaseStats;

  // Case Actions
  createCase: (data: CreateCaseInput) => Case;
  updateCase: (id: string, data: UpdateCaseInput) => void;
  deleteCase: (id: string) => void;
  getCaseById: (id: string) => Case | undefined;

  // Assignment Actions
  assignCase: (caseId: string, userId: string, userName: string) => void;
  unassignCase: (caseId: string) => void;

  // Status Actions
  updateStatus: (caseId: string, status: CaseStatus) => void;

  // Notes Actions
  addNote: (caseId: string, content: string, isPrivate?: boolean) => void;

  // Attachment Actions
  addAttachment: (caseId: string, attachment: Omit<CaseAttachment, 'id' | 'caseId' | 'uploadedAt'>) => void;
  removeAttachment: (caseId: string, attachmentId: string) => void;

  // Filter Actions
  setFilters: (filters: Partial<CaseFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCase: (caseItem: Case | null) => void;
}

const defaultFilters: CaseFilters = {
  status: [],
  priority: [],
  type: [],
  assigneeId: [],
};

const defaultSortOption: SortOption = {
  field: 'createdAt',
  order: 'desc',
};

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useLocalStorage<Case[]>('gcmp-cases', mockCases);
  const [filters, setFiltersState] = useState<CaseFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(defaultSortOption);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filteredCases = useMemo(() => {
    if (!isHydrated) return [];

    let result = [...cases];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.caseNumber.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          (c.assigneeName && c.assigneeName.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.status.length > 0) {
      result = result.filter((c) => filters.status.includes(c.status));
    }
    if (filters.priority.length > 0) {
      result = result.filter((c) => filters.priority.includes(c.priority));
    }
    if (filters.type.length > 0) {
      result = result.filter((c) => filters.type.includes(c.type));
    }
    if (filters.assigneeId.length > 0) {
      result = result.filter((c) => c.assigneeId && filters.assigneeId.includes(c.assigneeId));
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
        case 'priority': {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'status': {
          const statusOrder = { open: 1, 'in-progress': 2, closed: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
      }
      return sortOption.order === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [cases, filters, searchQuery, sortOption, isHydrated]);

  const caseStats = useMemo((): CaseStats => {
    if (!isHydrated) return { total: 0, open: 0, inProgress: 0, closed: 0, critical: 0, high: 0, unassigned: 0 };

    return {
      total: cases.length,
      open: cases.filter((c) => c.status === 'open').length,
      inProgress: cases.filter((c) => c.status === 'in-progress').length,
      closed: cases.filter((c) => c.status === 'closed').length,
      critical: cases.filter((c) => c.priority === 'critical').length,
      high: cases.filter((c) => c.priority === 'high').length,
      unassigned: cases.filter((c) => !c.assigneeId).length,
    };
  }, [cases, isHydrated]);

  const createCase = useCallback((data: CreateCaseInput): Case => {
    const now = new Date().toISOString();
    const newCase: Case = {
      id: generateId(),
      caseNumber: generateCaseNumber(),
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'open',
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      assigneeName: null,
      createdById: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
      createdAt: now,
      updatedAt: now,
      dueDate: data.dueDate,
      location: data.location,
      notes: [],
      activities: [
        {
          id: generateId(),
          caseId: '',
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'case-created',
          details: 'Case created',
          timestamp: now,
        },
      ],
      attachments: [],
      tags: [],
    };
    newCase.activities[0].caseId = newCase.id;

    setCases((prev) => [newCase, ...prev]);
    return newCase;
  }, [setCases]);

  const updateCase = useCallback((id: string, data: UpdateCaseInput) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const updatedCase = { ...c, ...data, updatedAt: now };

        // Add activity entry
        const activity: ActivityEntry = {
          id: generateId(),
          caseId: id,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'case-updated',
          details: 'Case details updated',
          timestamp: now,
        };
        updatedCase.activities = [activity, ...c.activities];

        return updatedCase;
      })
    );
  }, [setCases]);

  const deleteCase = useCallback((id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }, [setCases]);

  const getCaseById = useCallback((id: string): Case | undefined => {
    return cases.find((c) => c.id === id);
  }, [cases]);

  const assignCase = useCallback((caseId: string, userId: string, userName: string) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'assigned',
          details: `Assigned to ${userName}`,
          timestamp: now,
        };

        return {
          ...c,
          assigneeId: userId,
          assigneeName: userName,
          updatedAt: now,
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

  const unassignCase = useCallback((caseId: string) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'unassigned',
          details: 'Case unassigned',
          timestamp: now,
        };

        return {
          ...c,
          assigneeId: null,
          assigneeName: null,
          updatedAt: now,
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

  const updateStatus = useCallback((caseId: string, status: CaseStatus) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'status-changed',
          details: `Status changed from ${c.status} to ${status}`,
          timestamp: now,
        };

        return {
          ...c,
          status,
          updatedAt: now,
          closedAt: status === 'closed' ? now : c.closedAt,
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

  const addNote = useCallback((caseId: string, content: string, isPrivate: boolean = false) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const note: CaseNote = {
          id: generateId(),
          caseId,
          authorId: currentUser.id,
          authorName: `${currentUser.firstName} ${currentUser.lastName}`,
          content,
          createdAt: now,
          isPrivate,
        };

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'note-added',
          details: 'Added a note',
          timestamp: now,
        };

        return {
          ...c,
          updatedAt: now,
          notes: [note, ...c.notes],
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

  const addAttachment = useCallback((
    caseId: string,
    attachment: Omit<CaseAttachment, 'id' | 'caseId' | 'uploadedAt'>
  ) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const newAttachment: CaseAttachment = {
          id: generateId(),
          caseId,
          uploadedAt: now,
          ...attachment,
        };

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'attachment-added',
          details: `Added attachment: ${attachment.fileName}`,
          timestamp: now,
        };

        return {
          ...c,
          updatedAt: now,
          attachments: [...c.attachments, newAttachment],
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

  const removeAttachment = useCallback((caseId: string, attachmentId: string) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const attachment = c.attachments.find(a => a.id === attachmentId);
        if (!attachment) return c;

        const activity: ActivityEntry = {
          id: generateId(),
          caseId,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'attachment-removed',
          details: `Removed attachment: ${attachment.fileName}`,
          timestamp: now,
        };

        return {
          ...c,
          updatedAt: now,
          attachments: c.attachments.filter(a => a.id !== attachmentId),
          activities: [activity, ...c.activities],
        };
      })
    );
  }, [setCases]);

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
    sortOption,
    viewMode,
    caseStats,
    createCase,
    updateCase,
    deleteCase,
    getCaseById,
    assignCase,
    unassignCase,
    updateStatus,
    addNote,
    addAttachment,
    removeAttachment,
    setFilters,
    clearFilters,
    setSearchQuery,
    setSortOption,
    setViewMode,
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
