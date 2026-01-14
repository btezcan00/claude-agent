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
