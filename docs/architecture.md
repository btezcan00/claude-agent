# Architecture Overview

## Directory Structure

```
claude-agent/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard route group (protected)
│   │   ├── cases/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Case detail view
│   │   │   └── page.tsx          # Cases list/grid view
│   │   ├── team/
│   │   │   └── page.tsx          # Team management
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   │   └── page.tsx              # Dashboard home (redirects to /cases)
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # AI chat API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── components/
│   ├── cases/                    # Case-related components
│   │   ├── case-activity-timeline.tsx
│   │   ├── case-assign-dialog.tsx
│   │   ├── case-attachments.tsx
│   │   ├── case-card.tsx
│   │   ├── case-create-dialog.tsx
│   │   ├── case-detail-header.tsx
│   │   ├── case-detail-info.tsx
│   │   ├── case-edit-dialog.tsx
│   │   ├── case-filters.tsx
│   │   ├── case-grid.tsx
│   │   ├── case-list.tsx
│   │   ├── case-notes.tsx
│   │   ├── case-priority-badge.tsx
│   │   ├── case-sort.tsx
│   │   ├── case-status-badge.tsx
│   │   ├── case-type-badge.tsx
│   │   └── attachment-preview-dialog.tsx
│   ├── chat/
│   │   └── chat-bot.tsx          # AI chat widget
│   ├── common/
│   │   └── stats-card.tsx        # Statistics card component
│   ├── layout/
│   │   ├── header.tsx            # Top navigation header
│   │   ├── mobile-nav.tsx        # Mobile navigation
│   │   └── sidebar.tsx           # Main sidebar navigation
│   ├── team/
│   │   └── team-member-card.tsx  # Team member display card
│   └── ui/                       # shadcn/ui components
│       ├── alert-dialog.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── context/
│   ├── case-context.tsx          # Case state management
│   └── user-context.tsx          # User/team state management
│
├── types/
│   ├── case.ts                   # Case-related types
│   ├── user.ts                   # User-related types
│   └── common.ts                 # Shared types
│
├── hooks/
│   ├── use-debounce.ts           # Debounce hook for search
│   └── use-local-storage.ts      # localStorage persistence hook
│
├── lib/
│   ├── constants.ts              # Configuration constants
│   ├── date-utils.ts             # Date formatting utilities
│   └── utils.ts                  # General utilities (cn, generateId, etc.)
│
├── data/
│   ├── mock-cases.ts             # Sample case data
│   └── mock-users.ts             # Sample user/team data
│
└── docs/                         # Documentation
```

## State Management

### Context Providers

The application uses React Context for global state management with two main providers:

#### CaseContext (`context/case-context.tsx`)

Manages all case-related state and operations:

```typescript
interface CaseContextValue {
  // State
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

  // Status & Notes
  updateStatus: (caseId: string, status: CaseStatus) => void;
  addNote: (caseId: string, content: string, isPrivate?: boolean) => void;

  // Attachments
  addAttachment: (caseId: string, attachment: Omit<CaseAttachment, 'id' | 'caseId' | 'uploadedAt'>) => void;
  removeAttachment: (caseId: string, attachmentId: string) => void;

  // Filter Actions
  setFilters: (filters: Partial<CaseFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
}
```

#### UserContext (`context/user-context.tsx`)

Manages user and team member state:

```typescript
interface UserContextValue {
  currentUser: User;
  users: User[];
  getUserById: (id: string) => User | undefined;
  getUserFullName: (user: User) => string;
}
```

### Data Persistence

Data is persisted to browser localStorage using a custom hook:

```typescript
// hooks/use-local-storage.ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void]
```

**Storage Keys:**
- `gcmp-cases` - All case data including notes, activities, and attachments

**Limitations:**
- localStorage has ~5MB limit per domain
- File attachments are stored as base64 (1MB max per file, 3MB max per case)
- No backend/database - data is browser-specific

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │   UI Layer   │────▶│   Context    │────▶│ localStorage │   │
│   │  Components  │◀────│  Providers   │◀────│  Persistence │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│          │                    │                                  │
│          │                    │                                  │
│          ▼                    ▼                                  │
│   ┌──────────────┐     ┌──────────────┐                         │
│   │  Chat Bot    │────▶│  /api/chat   │                         │
│   │  Component   │◀────│   Route      │                         │
│   └──────────────┘     └──────────────┘                         │
│                               │                                  │
└───────────────────────────────│──────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │   Anthropic API      │
                    │   (Claude Opus 4.5)  │
                    └──────────────────────┘
```

### Flow Description

1. **UI Layer**: React components render the interface and capture user actions
2. **Context Providers**: Manage global state, filtering, sorting, and CRUD operations
3. **localStorage**: Persists case data between sessions via `useLocalStorage` hook
4. **Chat Bot**: Sends user messages + case context to the API
5. **API Route**: Processes chat with Claude, returns tool calls or text responses
6. **Anthropic API**: Claude processes requests and determines appropriate tool usage

## Component Architecture

### Layout Components

```
┌─────────────────────────────────────────────────────────────┐
│ RootLayout (app/layout.tsx)                                 │
│  - ThemeProvider                                            │
│  - CaseProvider                                             │
│  - UserProvider                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ DashboardLayout (app/(dashboard)/layout.tsx)          │ │
│  │  ┌─────────┬─────────────────────────────────────────┐│ │
│  │  │ Sidebar │              Header                     ││ │
│  │  │         ├─────────────────────────────────────────┤│ │
│  │  │         │                                         ││ │
│  │  │         │           Page Content                  ││ │
│  │  │         │                                         ││ │
│  │  │         │                                         ││ │
│  │  └─────────┴─────────────────────────────────────────┘│ │
│  │                                           ChatBot (floating)
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Case Detail Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ CaseDetailHeader                                            │
│  - Back button, case number, badges                         │
│  - Actions: Edit, Assign, Delete                            │
├─────────────────────────────────────────────────────────────┤
│ Tabs                                                        │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Overview │  Notes   │ Activity │Attachments│             │
│  └──────────┴──────────┴──────────┴──────────┘             │
├─────────────────────────────────────────────────────────────┤
│ Tab Content                                                 │
│  - CaseDetailInfo (Overview)                                │
│  - CaseNotes (Notes)                                        │
│  - CaseActivityTimeline (Activity)                          │
│  - CaseAttachments (Attachments)                            │
└─────────────────────────────────────────────────────────────┘
```

## Technology Choices

| Technology | Purpose | Why |
|------------|---------|-----|
| Next.js 16 | Framework | App Router, server components, API routes |
| TypeScript | Type Safety | Catch errors at compile time, better DX |
| Tailwind CSS | Styling | Utility-first, rapid development |
| shadcn/ui | Components | Accessible, customizable, Radix-based |
| React Context | State | Simple, no external deps, sufficient for app size |
| localStorage | Persistence | No backend needed for demo, instant setup |
| Claude Opus 4.5 | AI | Advanced reasoning, tool use, vision capabilities |
