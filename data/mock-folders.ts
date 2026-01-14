import { Folder } from '@/types/folder';

export const mockFolders: Folder[] = [
  {
    id: 'folder-001',
    name: 'Human Trafficking Priority',
    description: 'High priority human trafficking investigations requiring immediate attention',
    createdById: 'user-001',
    createdByName: 'Sarah Mitchell',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-03-01T14:00:00Z',
    ownerId: 'user-001',
    ownerName: 'Sarah Mitchell',
    color: '#ef4444',
    icon: 'alert-triangle',
  },
  {
    id: 'folder-002',
    name: 'Narcotics Operations',
    description: 'All drug-related investigations and operations',
    createdById: 'user-001',
    createdByName: 'Sarah Mitchell',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T11:00:00Z',
    ownerId: 'user-004',
    ownerName: 'Michael Thompson',
    color: '#8b5cf6',
    icon: 'shield',
  },
  {
    id: 'folder-003',
    name: 'Multi-Agency Coordination',
    description: 'Investigations requiring coordination with federal agencies',
    createdById: 'user-001',
    createdByName: 'Sarah Mitchell',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
    ownerId: null,
    ownerName: null,
    color: '#3b82f6',
    icon: 'users',
  },
];

export function getFolderById(id: string): Folder | undefined {
  return mockFolders.find((f) => f.id === id);
}
