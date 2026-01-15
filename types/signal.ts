export type SignalType =
  | 'bogus-scheme'
  | 'human-trafficking'
  | 'drug-trafficking'
  | 'bibob-research'
  | 'money-laundering';

export type SignalSource =
  | 'police'
  | 'bibob-request'
  | 'anonymous-report'
  | 'municipal-department'
  | 'other';

export interface ContactPerson {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  wantsFeedback: boolean;
}

// Signal Indicators
export interface IndicatorSubcategory {
  id: string;
  label: string;
}

export interface IndicatorCategory {
  id: string;
  label: string;
  subcategories: IndicatorSubcategory[];
}

export interface SignalIndicator {
  categoryId: string;
  subcategoryId: string;
}

export interface SignalNote {
  id: string;
  signalId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate: boolean;
}

export type ActivityAction =
  | 'signal-created'
  | 'signal-updated'
  | 'assigned'
  | 'unassigned'
  | 'note-added'
  | 'photo-added'
  | 'photo-removed'
  | 'attachment-added'
  | 'attachment-removed'
  | 'folder-added'
  | 'folder-removed';

export interface ActivityEntry {
  id: string;
  signalId: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SignalAttachment {
  id: string;
  signalId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  content?: string;
  textContent?: string;
}

export interface SignalFolderRelation {
  folderId: string;
  relation?: string;
}

export interface SignalPhoto {
  id: string;
  signalId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  content?: string;
}

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export const ALLOWED_FILE_TYPES = {
  images: ALLOWED_PHOTO_TYPES,
  documents: ALLOWED_DOCUMENT_TYPES,
} as const;

export const ALL_ALLOWED_FILE_TYPES = [
  ...ALLOWED_PHOTO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB per file
export const MAX_PHOTOS = 10;
export const MAX_ATTACHMENTS = 5;
export const MAX_TOTAL_PHOTOS_SIZE = 10 * 1024 * 1024; // 10MB for photos
export const MAX_TOTAL_ATTACHMENTS_SIZE = 5 * 1024 * 1024; // 5MB for attachments

export interface Signal {
  id: string;
  signalNumber: string;
  description: string;
  types: SignalType[];
  placeOfObservation: string;
  locationDescription?: string;
  timeOfObservation: string;
  receivedBy: SignalSource;
  contactPerson?: ContactPerson;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  notes: SignalNote[];
  activities: ActivityEntry[];
  photos: SignalPhoto[];
  attachments: SignalAttachment[];
  tags?: string[];
  folderRelations: SignalFolderRelation[];
  indicators: SignalIndicator[];
}

export interface SignalFilters {
  type: SignalType[];
  receivedBy: SignalSource[];
  folderId: string[];
}

export type SortField = 'createdAt' | 'updatedAt' | 'timeOfObservation';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
}

export interface CreateSignalInput {
  description: string;
  types: SignalType[];
  placeOfObservation: string;
  locationDescription?: string;
  timeOfObservation: string;
  receivedBy: SignalSource;
  contactPerson?: ContactPerson;
  folderIds?: string[];
}

export interface UpdateSignalInput {
  description?: string;
  types?: SignalType[];
  placeOfObservation?: string;
  locationDescription?: string;
  timeOfObservation?: string;
  receivedBy?: SignalSource;
  contactPerson?: ContactPerson;
  folderIds?: string[];
}
