import { Organization } from './organization';
import { Address } from './address';
import { Person } from './person';

export type CaseStatus =
  | 'application'
  | 'research'
  | 'national_office'
  | 'decision'
  | 'archive';

export interface CaseStatusDates {
  application?: string;
  research?: string;
  national_office?: string;
  decision?: string;
  archive?: string;
}

export type CaseAccessLevel = 'view' | 'edit' | 'admin';

export type SuggestionSource = 'persons' | 'reports' | 'files';

export interface CasePractitioner {
  userId: string;
  userName: string;
  addedAt: string;
}

export interface CaseShare {
  userId: string;
  userName: string;
  accessLevel: CaseAccessLevel;
  sharedAt: string;
  sharedBy: string;
}

export interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  isAdminNote: boolean;
}

export interface CaseChatMessage {
  id: string;
  conversationId: string;  // contactId to group messages
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
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

export interface CaseItem {
  id: string;
  date: string;
  phase: CaseStatus;
  label: string;
  description: string;
  assignedTo?: string;
  source?: SuggestionSource;
  sourceTheme?: string;
}

export interface FindingItem extends CaseItem {
  isCompleted: boolean;
  totalSteps?: number;
  completedSteps?: number;
  severity?: 'none' | 'low' | 'serious' | 'critical';
}

export interface LetterItem {
  id: string;
  name: string;
  template: string;
  description: string;
  tags: string[];
  createdBy: string;
  createdByFirstName: string;
  createdBySurname: string;
  createdAt: string;
  updatedAt: string;
  fieldData: Record<string, string | boolean>;
}

export const LETTER_TEMPLATES = [
  { value: 'lbb_notification', label: 'LBB notification letter', description: '' },
  { value: 'bibob_7c_request', label: 'Form for requesting information from an administrative body to the Tax Authorities pursuant to Article 7c of the Bibob Act', description: '' },
] as const;

// ActivityItem with additional tracking fields
export interface ActivityItem {
  id: string;
  date: string;
  phase: CaseStatus;
  label: string;
  description: string;
  assignedTo?: string;
  source?: SuggestionSource;
  sourceTheme?: string;
  createdByName: string;
  updatedAt: string;
}

export const APPLICATION_CRITERIA = [
  { id: 'necessary_info', name: 'necessary_info', label: 'Provided all necessary information?' },
  { id: 'annual_accounts', name: 'annual_accounts', label: 'Annual Accounts' },
  { id: 'budgets', name: 'budgets', label: 'Budgets' },
  { id: 'loan_agreement', name: 'loan_agreement', label: 'Loan Agreement' },
] as const;

export interface Case {
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
  status: CaseStatus;
  statusDates: CaseStatusDates;
  // New fields
  tags: string[];
  signalTypes: string[];
  practitioners: CasePractitioner[];
  sharedWith: CaseShare[];
  location: string;
  notes: CaseNote[];
  organizations: Organization[];
  addresses: Address[];
  peopleInvolved: Person[];
  letters: LetterItem[];
  findings: FindingItem[];
  attachments: CaseItem[];
  records: CaseItem[];
  communications: CaseItem[];
  suggestions: CaseItem[];
  visualizations: CaseItem[];
  activities: ActivityItem[];
  // File attachments with actual file content
  fileAttachments: CaseAttachment[];
  // Chat messages for communication feature
  chatMessages: CaseChatMessage[];
  // Application data
  applicationData: ApplicationData;
}

export interface CreateCaseInput {
  name: string;
  description: string;
  ownerId?: string;
  ownerName?: string;
  color?: string;
  icon?: string;
  location?: string;
  signalIds?: string[];
}

export interface UpdateCaseInput {
  name?: string;
  description?: string;
  ownerId?: string | null;
  color?: string;
  icon?: string;
}

export interface CaseFilters {
  ownerId: string[];
}

export interface CaseStats {
  total: number;
  withSignals: number;
  empty: number;
}

export const CASE_COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
] as const;

export const CASE_ICONS = [
  'case',
  'case-open',
  'file-text',
  'alert-triangle',
  'shield',
  'users',
  'map-pin',
  'clock',
  'flag',
  'star',
] as const;

export const CASE_ACCESS_LEVELS: {
  value: CaseAccessLevel;
  label: string;
  description: string;
}[] = [
    { value: 'view', label: 'View', description: 'Can view case and signals' },
    { value: 'edit', label: 'Edit', description: 'Can edit case and add signals' },
    { value: 'admin', label: 'Admin', description: 'Full access including sharing' },
  ];

// File Attachment types and constants
export interface CaseAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  description: string;
  tags: string[];
  content?: string;      // Base64 encoded
  textContent?: string;  // Extracted text for PDFs
}

export const CASE_ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export const CASE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

export const CASE_STATUSES: {
  value: CaseStatus;
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
