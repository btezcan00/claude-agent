export type CaseType =
  | 'human-trafficking'
  | 'illegal-drugs'
  | 'illegal-prostitution';

export type CaseStatus =
  | 'open'
  | 'in-progress'
  | 'closed';

export type PriorityLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate: boolean;
}

export type ActivityAction =
  | 'case-created'
  | 'case-updated'
  | 'status-changed'
  | 'priority-changed'
  | 'assigned'
  | 'unassigned'
  | 'note-added'
  | 'attachment-added'
  | 'attachment-removed';

export interface ActivityEntry {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CaseAttachment {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: CaseStatus;
  priority: PriorityLevel;
  assigneeId: string | null;
  assigneeName: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  dueDate?: string;
  notes: CaseNote[];
  activities: ActivityEntry[];
  attachments: CaseAttachment[];
  tags?: string[];
  location?: string;
}

export interface CaseFilters {
  status: CaseStatus[];
  priority: PriorityLevel[];
  type: CaseType[];
  assigneeId: string[];
}

export type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'dueDate';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
}

export interface CreateCaseInput {
  title: string;
  description: string;
  type: CaseType;
  priority: PriorityLevel;
  assigneeId?: string;
  dueDate?: string;
  location?: string;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  type?: CaseType;
  priority?: PriorityLevel;
  status?: CaseStatus;
  assigneeId?: string | null;
  dueDate?: string;
  location?: string;
}
