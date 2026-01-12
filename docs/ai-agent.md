# AI Agent Documentation

## Overview

The GCMP AI Assistant is powered by **Claude Opus 4.5** and provides natural language case management capabilities. Users interact via a floating chat widget that can perform both read and write operations on cases.

**Model**: `claude-opus-4-5-20251101`
**Max Tokens**: 1024 (responses), 2048 (attachment analysis)
**Location**: Bottom-right floating button
**Component**: `components/chat/chat-bot.tsx`
**API Route**: `app/api/chat/route.ts`

---

## Tool Summary

| Tool | Type | Confirmation | Description |
|------|------|--------------|-------------|
| `summarize_cases` | Read | No | Get case overview or specific case details |
| `list_team_members` | Read | No | List team members with workload |
| `get_case_stats` | Read | No | Get dashboard statistics |
| `search_cases` | Read | No | Search by keyword, status, priority, etc. |
| `get_case_activity` | Read | No | Get case activity timeline |
| `get_case_notes` | Read | No | Get all notes for a case |
| `get_overdue_cases` | Read | No | Find cases past due date |
| `get_unassigned_cases` | Read | No | Find cases without assignee |
| `summarize_attachments` | Read | No | AI analysis of case files/images |
| `create_case` | Write | **Yes** | Create a new case |
| `edit_case` | Write | **Yes** | Update case details |
| `add_note` | Write | **Yes** | Add note to case |
| `assign_case` | Write | **Yes** | Assign case to team member |
| `unassign_case` | Write | **Yes** | Remove case assignment |
| `delete_case` | Write | **Yes** | Delete a case |
| `change_status` | Write | **Yes** | Change case status |

---

## Read Operations (9 Tools)

### summarize_cases

Get overview of all cases or specific case details.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | No | Specific case ID or number to summarize |

**Example Usage**:
- "Summarize all cases"
- "Tell me about case GCMP-2024-001234"
- "What's the status of the trafficking case?"

---

### list_team_members

List available team members for case assignment.

**Parameters**: None

**Returns**: Team member list with names, titles, and workload (active/max cases)

**Example Usage**:
- "Who's available for assignment?"
- "Show me the team"
- "List team members"

---

### get_case_stats

Get dashboard statistics.

**Parameters**: None

**Returns**:
- Total case count
- Open, In-Progress, Closed counts
- Critical and High priority counts
- Unassigned case count

**Example Usage**:
- "Show me the case statistics"
- "How many open cases do we have?"
- "Dashboard overview"

---

### search_cases

Search and filter cases by criteria.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `keyword` | string | No | Search in title, description, case number |
| `status` | enum | No | `open`, `in-progress`, `closed` |
| `priority` | enum | No | `low`, `medium`, `high`, `critical` |
| `type` | enum | No | `human-trafficking`, `illegal-drugs`, `illegal-prostitution` |
| `assignee_name` | string | No | Filter by assignee name |

**Example Usage**:
- "Find all critical cases"
- "Search for trafficking cases assigned to James"
- "Show open drug cases"

---

### get_case_activity

Get activity timeline for a specific case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or case number |

**Example Usage**:
- "Show activity for case GCMP-2024-001234"
- "What happened on the trafficking case?"

---

### get_case_notes

Get all notes for a specific case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or case number |

**Example Usage**:
- "Show notes for case GCMP-2024-001234"
- "What notes are on the drug case?"

---

### get_overdue_cases

Find cases past their due date (not closed).

**Parameters**: None

**Example Usage**:
- "Show overdue cases"
- "What cases are past due?"
- "Find late cases"

---

### get_unassigned_cases

Find cases without an assignee.

**Parameters**: None

**Example Usage**:
- "Show unassigned cases"
- "What cases need assignment?"
- "Find cases without owners"

---

### summarize_attachments

Analyze and summarize case attachments using AI vision.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or case number |

**Capabilities**:
- **Images**: Analyzed using Claude's vision (JPEG, PNG, GIF, WebP)
- **Text files**: Content extracted and summarized (TXT, CSV)
- **Documents**: Basic metadata reported (PDF, Word, Excel)

**Processing**: Server-side via separate Claude API call with multimodal content

**Example Usage**:
- "Summarize attachments for case GCMP-2024-001234"
- "What's in the files on the trafficking case?"
- "Analyze the images attached to case 001"

---

## Write Operations (7 Tools)

All write operations require user confirmation before execution.

### create_case

Create a new case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Case title |
| `description` | string | Yes | Case description |
| `type` | enum | Yes | `human-trafficking`, `illegal-drugs`, `illegal-prostitution` |
| `priority` | enum | Yes | `low`, `medium`, `high`, `critical` |
| `location` | string | No | Location of incident |

**Example Usage**:
- "Create a new human trafficking case titled 'Port Investigation'"
- "Add a critical drug case for downtown district"

---

### edit_case

Update an existing case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number to edit |
| `title` | string | No | New title |
| `description` | string | No | New description |
| `type` | enum | No | New type |
| `priority` | enum | No | New priority |
| `status` | enum | No | New status |
| `location` | string | No | New location |

**Example Usage**:
- "Change the priority of case GCMP-2024-001234 to critical"
- "Update the description of the trafficking case"

---

### add_note

Add a note to a case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number |
| `content` | string | Yes | Note content |
| `is_private` | boolean | No | Private flag (default: false) |

**Example Usage**:
- "Add a note to case GCMP-2024-001234: Surveillance completed"
- "Add a private note about the informant"

---

### assign_case

Assign a case to a team member.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number |
| `assignee_name` | string | Yes | Full name of team member |

**Example Usage**:
- "Assign case GCMP-2024-001234 to James Rodriguez"
- "Give the trafficking case to Emily Chen"

---

### unassign_case

Remove assignment from a case.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number |

**Example Usage**:
- "Unassign case GCMP-2024-001234"
- "Remove the assignee from the drug case"

---

### delete_case

Delete a case from the system.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number |

**Example Usage**:
- "Delete case GCMP-2024-001234"
- "Remove the closed prostitution case"

---

### change_status

Change case status.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `case_id` | string | Yes | Case ID or number |
| `new_status` | enum | Yes | `open`, `in-progress`, `closed` |

**Example Usage**:
- "Close case GCMP-2024-001234"
- "Mark the trafficking case as in-progress"

---

## Confirmation Workflow

For write operations, the AI follows this flow:

```
1. User Request
   │
   ▼
2. AI Determines Tool
   │
   ▼
3. Chat Bot Shows Confirmation
   "I'll perform the following action:
    - Create case: 'Port Investigation' (human-trafficking, critical)
    Should I proceed? (Yes/No)"
   │
   ▼
4. User Confirms (Yes) or Cancels (No)
   │
   ▼
5. Action Executed (if confirmed)
   │
   ▼
6. Result Displayed
```

**Confirmation Triggers**:
- "yes", "confirm", "ok" → Execute action
- "no", "cancel" → Cancel action

**Batch Operations**: Multiple actions can be queued and confirmed together.

---

## Context Provided to AI

The AI receives the following context with each request:

### Case Data
```typescript
{
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notesCount: number;
  activitiesCount: number;
  attachments: AttachmentData[];  // For summarize_attachments
}
```

### Team Member Data
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  activeCasesCount: number;
  maxCaseCapacity: number;
}
```

---

## System Prompt

The AI is configured with this role:

> "You are an AI assistant for the Government Case Management Platform (GCMP). You help government employees manage crime cases related to human trafficking, illegal drugs, and illegal prostitution."

**Instructions**:
- Use case numbers (GCMP-XXXX-XXXXXX) for clarity
- Use full names when assigning cases
- Confirm before making changes
- Be professional, concise, and helpful

---

## Implementation Files

| File | Purpose |
|------|---------|
| `app/api/chat/route.ts` | API endpoint, tool definitions, Claude integration |
| `components/chat/chat-bot.tsx` | Chat UI, tool result handling, confirmation flow |
| `context/case-context.tsx` | Case operations executed by chat |
