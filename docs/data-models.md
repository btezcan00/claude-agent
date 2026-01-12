# Data Models

All TypeScript types are defined in the `/types` directory.

## Case Types (`types/case.ts`)

### Case

The main case entity:

```typescript
interface Case {
  id: string;                      // Unique identifier (UUID)
  caseNumber: string;              // Display number (e.g., "GCMP-2024-001234")
  title: string;                   // Case title
  description: string;             // Detailed description
  type: CaseType;                  // Crime type
  status: CaseStatus;              // Current status
  priority: PriorityLevel;         // Priority level
  assigneeId: string | null;       // Assigned user ID
  assigneeName: string | null;     // Assigned user display name
  createdById: string;             // Creator user ID
  createdByName: string;           // Creator display name
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp
  closedAt?: string;               // ISO timestamp (when closed)
  dueDate?: string;                // ISO date string
  location?: string;               // Location description
  notes: CaseNote[];               // Associated notes
  activities: ActivityEntry[];     // Activity timeline
  attachments: CaseAttachment[];   // File attachments
  tags?: string[];                 // Optional tags
}
```

### CaseType

```typescript
type CaseType =
  | 'human-trafficking'
  | 'illegal-drugs'
  | 'illegal-prostitution';
```

### CaseStatus

```typescript
type CaseStatus =
  | 'open'
  | 'in-progress'
  | 'closed';
```

### PriorityLevel

```typescript
type PriorityLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';
```

### CaseNote

```typescript
interface CaseNote {
  id: string;              // Unique identifier
  caseId: string;          // Parent case ID
  authorId: string;        // Note author user ID
  authorName: string;      // Author display name
  content: string;         // Note content
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp (if edited)
  isPrivate: boolean;      // Private visibility flag
}
```

### CaseAttachment

```typescript
interface CaseAttachment {
  id: string;              // Unique identifier
  caseId: string;          // Parent case ID
  fileName: string;        // Original filename
  fileType: string;        // MIME type (e.g., "image/png")
  fileSize: number;        // Size in bytes
  uploadedBy: string;      // Uploader display name
  uploadedAt: string;      // ISO timestamp
  content?: string;        // Base64 encoded file data
  textContent?: string;    // Extracted text (for text files)
}
```

### ActivityEntry

```typescript
interface ActivityEntry {
  id: string;              // Unique identifier
  caseId: string;          // Parent case ID
  userId: string;          // Actor user ID
  userName: string;        // Actor display name
  action: ActivityAction;  // Action type
  details: string;         // Human-readable description
  timestamp: string;       // ISO timestamp
  metadata?: Record<string, unknown>;  // Additional data
}
```

### ActivityAction

```typescript
type ActivityAction =
  | 'case-created'
  | 'case-updated'
  | 'status-changed'
  | 'priority-changed'
  | 'assigned'
  | 'unassigned'
  | 'note-added'
  | 'attachment-added'
  | 'attachment-removed';
```

### File Upload Constants

```typescript
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
};

const MAX_FILE_SIZE = 1 * 1024 * 1024;           // 1MB per file
const MAX_TOTAL_ATTACHMENTS_SIZE = 3 * 1024 * 1024;  // 3MB per case
```

### Filter & Sort Types

```typescript
interface CaseFilters {
  status: CaseStatus[];
  priority: PriorityLevel[];
  type: CaseType[];
  assigneeId: string[];
}

type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'dueDate';
type SortOrder = 'asc' | 'desc';

interface SortOption {
  field: SortField;
  order: SortOrder;
}
```

### Input Types

```typescript
interface CreateCaseInput {
  title: string;
  description: string;
  type: CaseType;
  priority: PriorityLevel;
  assigneeId?: string;
  dueDate?: string;
  location?: string;
}

interface UpdateCaseInput {
  title?: string;
  description?: string;
  type?: CaseType;
  priority?: PriorityLevel;
  status?: CaseStatus;
  assigneeId?: string | null;
  dueDate?: string;
  location?: string;
}
```

---

## User Types (`types/user.ts`)

### User

```typescript
interface User {
  id: string;                  // Unique identifier
  employeeId: string;          // Employee ID (e.g., "EMP-001")
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: Department;
  title: string;               // Job title
  avatar?: string;             // Avatar URL
  activeCasesCount: number;    // Current assigned cases
  maxCaseCapacity: number;     // Maximum case load
  isActive: boolean;
  joinDate: string;            // ISO date
  lastActiveAt: string;        // ISO timestamp
  permissions: Permission[];
}
```

### UserRole

```typescript
type UserRole =
  | 'admin'
  | 'supervisor'
  | 'investigator'
  | 'analyst';
```

### Department

```typescript
type Department =
  | 'investigations'
  | 'analysis'
  | 'field-operations'
  | 'management';
```

### Permission

```typescript
type Permission =
  | 'cases:read'
  | 'cases:create'
  | 'cases:update'
  | 'cases:delete'
  | 'cases:assign'
  | 'team:read'
  | 'team:manage'
  | 'admin:access';
```

---

## Common Types (`types/common.ts`)

```typescript
type ViewMode = 'list' | 'grid';

interface CaseStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  critical: number;
  high: number;
  unassigned: number;
}
```

---

## Type Location Reference

| Type | File | Line |
|------|------|------|
| Case | `types/case.ts` | Main interface |
| CaseType | `types/case.ts` | Enum type |
| CaseStatus | `types/case.ts` | Enum type |
| PriorityLevel | `types/case.ts` | Enum type |
| CaseNote | `types/case.ts` | Interface |
| CaseAttachment | `types/case.ts` | Interface |
| ActivityEntry | `types/case.ts` | Interface |
| User | `types/user.ts` | Main interface |
| UserRole | `types/user.ts` | Enum type |
| CaseStats | `types/common.ts` | Interface |
