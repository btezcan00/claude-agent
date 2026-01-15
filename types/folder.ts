export type FolderStatus =
  | 'application'
  | 'research'
  | 'national_office'
  | 'decision'
  | 'archive';

export interface FolderStatusDates {
  application?: string;
  research?: string;
  national_office?: string;
  decision?: string;
  archive?: string;
}

export type FolderAccessLevel = 'view' | 'edit' | 'admin';

export interface FolderPractitioner {
  userId: string;
  userName: string;
  addedAt: string;
}

export interface FolderShare {
  userId: string;
  userName: string;
  accessLevel: FolderAccessLevel;
  sharedAt: string;
  sharedBy: string;
}

export interface FolderNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  isAdminNote: boolean;
}

export interface ApplicationCriterion {
  id: string;
  name: string;
  label: string;
  isMet: boolean;
  explanation: string;
}

export interface ApplicationData {
  explanation: string;
  criteria: ApplicationCriterion[];
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export const APPLICATION_CRITERIA = [
  { id: 'necessary_info', name: 'necessary_info', label: 'Provided all necessary information?' },
  { id: 'annual_accounts', name: 'annual_accounts', label: 'Annual Accounts' },
  { id: 'budgets', name: 'budgets', label: 'Budgets' },
  { id: 'loan_agreement', name: 'loan_agreement', label: 'Loan Agreement' },
] as const;

export interface Folder {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string | null;
  ownerName: string | null;
  color?: string;
  icon?: string;
  status: FolderStatus;
  statusDates: FolderStatusDates;
  // New fields
  tags: string[];
  signalTypes: string[];
  practitioners: FolderPractitioner[];
  sharedWith: FolderShare[];
  location: string;
  notes: FolderNote[];
  // Application data
  applicationData: ApplicationData;
}

export interface CreateFolderInput {
  name: string;
  description: string;
  ownerId?: string;
  color?: string;
  icon?: string;
  signalIds?: string[];
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  ownerId?: string | null;
  color?: string;
  icon?: string;
}

export interface FolderFilters {
  ownerId: string[];
}

export interface FolderStats {
  total: number;
  withSignals: number;
  empty: number;
}

export const FOLDER_COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
] as const;

export const FOLDER_ICONS = [
  'folder',
  'folder-open',
  'file-text',
  'alert-triangle',
  'shield',
  'users',
  'map-pin',
  'clock',
  'flag',
  'star',
] as const;

export const FOLDER_ACCESS_LEVELS: {
  value: FolderAccessLevel;
  label: string;
  description: string;
}[] = [
  { value: 'view', label: 'View', description: 'Can view folder and signals' },
  { value: 'edit', label: 'Edit', description: 'Can edit folder and add signals' },
  { value: 'admin', label: 'Admin', description: 'Full access including sharing' },
];

export const FOLDER_STATUSES: {
  value: FolderStatus;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
}[] = [
  {
    value: 'application',
    label: 'Application for Bibob Test',
    shortLabel: 'Application',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  {
    value: 'research',
    label: 'Own Research',
    shortLabel: 'Research',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  {
    value: 'national_office',
    label: 'National Bibob Office',
    shortLabel: 'National Office',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  {
    value: 'decision',
    label: 'Decision',
    shortLabel: 'Decision',
    color: '#22c55e',
    bgColor: '#f0fdf4',
  },
  {
    value: 'archive',
    label: 'Archive',
    shortLabel: 'Archive',
    color: '#6b7280',
    bgColor: '#f9fafb',
  },
];
