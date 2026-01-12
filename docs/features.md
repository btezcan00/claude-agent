# Platform Features

## Case Management

### Case Lifecycle

```
┌─────────┐     ┌─────────────┐     ┌────────┐
│  Open   │────▶│ In-Progress │────▶│ Closed │
└─────────┘     └─────────────┘     └────────┘
     ▲                │                  │
     │                │                  │
     └────────────────┴──────────────────┘
              (can revert status)
```

### Create Case

**Location**: Cases page → "New Case" button

**Required Fields**:
- Title
- Description
- Case Type (Human Trafficking, Illegal Drugs, Illegal Prostitution)
- Priority (Low, Medium, High, Critical)

**Optional Fields**:
- Assignee
- Due Date
- Location

**Component**: `components/cases/case-create-dialog.tsx`

### Edit Case

**Location**: Case detail page → "Edit" button

**Editable Fields**:
- Title
- Description
- Case Type
- Priority
- Due Date
- Location

**Note**: Status is changed via dedicated status actions, not the edit dialog.

**Component**: `components/cases/case-edit-dialog.tsx`

### Delete Case

**Location**: Case detail page → "Delete" button

- Requires confirmation dialog
- Permanently removes case and all associated data (notes, attachments, activities)
- Redirects to cases list after deletion

### Case Assignment

**Location**: Case detail page → "Assign" button

**Features**:
- Visual team member selection with avatars
- Workload indicator showing active cases / max capacity
- Color-coded workload bars:
  - Green: < 75% capacity
  - Yellow: 75-99% capacity
  - Red: >= 100% capacity
- Can assign or unassign in same dialog

**Component**: `components/cases/case-assign-dialog.tsx`

---

## Notes System

**Location**: Case detail page → "Notes" tab

### Adding Notes

- Rich text content area
- Optional private/public toggle
- Notes are attributed to current user
- Creates activity log entry

### Note Display

- Chronological order (newest first)
- Shows author name and relative timestamp
- Lock icon for private notes
- Full content display

**Component**: `components/cases/case-notes.tsx`

---

## Attachments

**Location**: Case detail page → "Attachments" tab

### Upload Methods

1. **Drag & Drop**: Drag files onto the upload zone
2. **File Picker**: Click "Browse Files" button

### Supported File Types

| Category | Extensions |
|----------|------------|
| Images | JPEG, PNG, GIF, WebP |
| Documents | PDF, DOC, DOCX, XLS, XLSX |
| Text | TXT, CSV |

### Storage Limits

- **Per file**: 1MB maximum
- **Per case**: 3MB total
- Storage bar shows current usage

### Features

- Preview images and PDFs inline
- Download any attachment
- Delete attachments
- Text extraction from text files for AI analysis
- Activity logging for uploads/deletions

**Components**:
- `components/cases/case-attachments.tsx`
- `components/cases/attachment-preview-dialog.tsx`

---

## Activity Timeline

**Location**: Case detail page → "Activity" tab

Tracks all actions on a case:

| Action | Icon | Color |
|--------|------|-------|
| case-created | Plus | Green |
| case-updated | Edit | Blue |
| status-changed | Refresh | Yellow |
| priority-changed | Flag | Orange |
| assigned | UserPlus | Purple |
| unassigned | UserMinus | Gray |
| note-added | MessageSquare | Blue |
| attachment-added | Paperclip | Green |
| attachment-removed | Trash | Red |

Each entry shows:
- Action type with icon
- Description of what changed
- User who performed action
- Relative timestamp

**Component**: `components/cases/case-activity-timeline.tsx`

---

## Search & Filtering

### Search

**Location**: Cases page → Search input in header

- Searches across: Title, Case Number, Description, Assignee Name
- Case-insensitive matching
- Real-time filtering with debounce

### Filters

**Location**: Cases page → Left sidebar

| Filter | Options |
|--------|---------|
| Status | Open, In-Progress, Closed |
| Priority | Low, Medium, High, Critical |
| Type | Human Trafficking, Illegal Drugs, Illegal Prostitution |
| Assignee | Any team member |

- Multi-select for each filter
- Active filter count badge
- "Clear All" button

**Component**: `components/cases/case-filters.tsx`

### Sorting

**Location**: Cases page → Sort dropdown

| Sort Field | Description |
|------------|-------------|
| Created Date | When case was created |
| Updated Date | Last modification time |
| Priority | Low → Critical or Critical → Low |
| Status | Open → Closed or Closed → Open |
| Due Date | Soonest first or latest first |

- Ascending/Descending toggle

**Component**: `components/cases/case-sort.tsx`

---

## View Modes

**Location**: Cases page → View toggle buttons

### List View

- Table format with sortable columns
- Columns: Case #, Title, Type, Status, Priority, Assignee, Updated
- Overdue cases highlighted in red
- Clickable rows

**Component**: `components/cases/case-list.tsx`

### Grid View

- Card-based layout
- Responsive grid
- Shows key case information per card

**Component**: `components/cases/case-grid.tsx`

---

## Team Management

**Location**: `/team` page

### Team Statistics

| Stat | Description |
|------|-------------|
| Team Members | Count of active members |
| Active Cases | Total cases not closed |
| Avg Workload | Average capacity percentage |
| At Capacity | Members at or over max |

### Team Member Cards

Each card displays:
- Name, title, role (with badge)
- Email, phone, department
- Workload bar with percentage
- Status: Light, Moderate, High, At Capacity
- Employee ID

**Workload Colors**:
- Green: < 60%
- Yellow: 60-79%
- Red: >= 80%

**Component**: `components/team/team-member-card.tsx`

---

## Dashboard Statistics

**Location**: Cases page → Top statistics cards

| Stat | Color | Description |
|------|-------|-------------|
| Total Cases | Default | All cases in system |
| Open | Blue | Status = open |
| In Progress | Yellow | Status = in-progress |
| Closed | Gray | Status = closed |
| Critical | Red | Priority = critical |
| Unassigned | Orange | No assignee |

**Component**: `components/common/stats-card.tsx`

---

## AI Chat Assistant

**Location**: Floating button (bottom-right corner)

See [AI Agent Documentation](./ai-agent.md) for full details.

**Quick Summary**:
- Natural language case management
- 16 available tools (9 read, 7 write)
- Confirmation required for write operations
- Attachment analysis with AI vision
