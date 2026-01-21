# Complete Agent Capabilities Report

**Government Case Management Platform (GCMP)**
*Full inventory of all platform features and MCP tool coverage*

---

## Executive Summary

This document provides a complete inventory of all platform capabilities, comparing what the platform supports vs what is currently exposed through MCP tools.

| Category | Platform Operations | MCP Tools Available | Coverage |
|----------|--------------------|--------------------|----------|
| **Case/Folder** | 50+ operations | 16 tools | ~32% |
| **Signal** | 20+ operations | 7 tools | ~35% |
| **Total** | 70+ operations | 29 tools | ~40% |

**Note:** Many platform operations can be performed via the generic `edit_case` and `folder_update` tools, but dedicated tools would provide better UX.

---

## 1. CASE/FOLDER CAPABILITIES

### 1.1 Core CRUD Operations

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Create case | `createFolder()` | `create_case` | ✅ Available |
| Read case | `getFolderById()` | `folder_get` | ✅ Available |
| Update case | `updateFolder()` | `edit_case` | ✅ Available |
| Delete case | `deleteFolder()` | `delete_case` | ✅ Available |
| List cases | `folders[]` | `summarize_cases` | ✅ Available |
| Search cases | filter logic | `search_cases` | ✅ Available |
| Get case stats | computed | `get_case_stats` | ✅ Available |

### 1.2 Ownership & Assignment

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Assign owner | `assignFolderOwner()` | `assign_case` | ✅ Available |
| Unassign owner | `unassignFolderOwner()` | `unassign_case` | ✅ Available |
| List unassigned | filter logic | `get_unassigned_cases` | ✅ Available |

### 1.3 Status/Workflow Management

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Change status | `updateFolderStatus()` | `change_status` | ✅ Available |
| Get by status | `getFoldersByStatus()` | `summarize_cases` (filter) | ✅ Available |
| Find overdue | computed | `get_overdue_cases` | ✅ Available |

**Status Flow:** `application` → `research` → `national_office` → `decision` → `archive`

### 1.4 Notes

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add note | `addFolderNote()` | `add_note` | ✅ Available |
| Get notes | `folder.notes` | `get_case_notes` | ✅ Available |
| Remove note | `removeFolderNote()` | ❌ | 🔴 Not exposed |
| Admin-only notes | `isAdminNote: true` | `add_note` (param) | ✅ Available |

### 1.5 Practitioners (Team Collaboration)

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add practitioner | `addPractitioner()` | ❌ | 🔴 Not exposed |
| Remove practitioner | `removePractitioner()` | ❌ | 🔴 Not exposed |
| List practitioners | `folder.practitioners` | via `folder_get` | ⚠️ Partial |

### 1.6 Sharing & Access Control

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Share folder | `shareFolder()` | ❌ | 🔴 Not exposed |
| Update access level | `updateShareAccess()` | ❌ | 🔴 Not exposed |
| Remove share | `removeShare()` | ❌ | 🔴 Not exposed |

**Access Levels:** `view` | `edit` | `admin`

### 1.7 Tags

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add tag | `addTag()` | via `edit_case` | ⚠️ Partial |
| Remove tag | `removeTag()` | via `edit_case` | ⚠️ Partial |
| Search by tag | filter logic | `search_cases` | ✅ Available |

### 1.8 Organizations

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add organization to case | `addOrganizationToFolder()` | ❌ | 🔴 Not exposed |
| Remove organization | `removeOrganization()` | ❌ | 🔴 Not exposed |
| List case organizations | `folder.organizations` | via `folder_get` | ⚠️ Partial |

### 1.9 Addresses

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add address to case | `addAddressToFolder()` | ❌ | 🔴 Not exposed |
| Remove address | `removeAddress()` | ❌ | 🔴 Not exposed |
| List case addresses | `folder.addresses` | via `folder_get` | ⚠️ Partial |

### 1.10 People Involved

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add person to case | `addPersonToFolder()` | ❌ | 🔴 Not exposed |
| Remove person | `removePersonInvolved()` | ❌ | 🔴 Not exposed |
| List people | `folder.peopleInvolved` | via `folder_get` | ⚠️ Partial |

### 1.11 Letters (Official Documents)

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Create letter | `addLetter()` | ❌ | 🔴 Not exposed |
| Update letter | `updateLetter()` | ❌ | 🔴 Not exposed |
| Remove letter | `removeLetter()` | ❌ | 🔴 Not exposed |

**Letter Templates:**
- LBB notification letter
- Bibob Article 7c Tax Authority request

### 1.12 Findings

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add finding | `addFinding()` | ❌ | 🔴 Not exposed |
| Remove finding | `removeFinding()` | ❌ | 🔴 Not exposed |
| Toggle completion | `toggleFindingCompletion()` | ❌ | 🔴 Not exposed |
| Search by severity | filter logic | `search_cases` | ✅ Available |

**Finding Severities:** `none` | `low` | `serious` | `critical`

**Finding Types:**
- LBB - no serious degree of danger
- LBB - a lower level of danger
- LBB - serious level of danger
- Serious danger - investing criminal assets (A)
- Serious danger - committing criminal offences (B)
- No serious level of danger

### 1.13 File Attachments

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add file | `addFileAttachment()` | ❌ | 🔴 Not exposed |
| Update file metadata | `updateFileAttachment()` | ❌ | 🔴 Not exposed |
| Remove file | `removeFileAttachment()` | ❌ | 🔴 Not exposed |
| Summarize attachments | computed | `summarize_attachments` | ✅ Available |

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word, Excel, CSV, Plain text

### 1.14 Communications (Internal Chat)

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add chat message | `addChatMessage()` | ❌ | 🔴 Not exposed |
| List messages | `folder.chatMessages` | via `folder_get` | ⚠️ Partial |

### 1.15 Suggestions

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add suggestion | `addSuggestion()` | ❌ | 🔴 Not exposed |
| Remove suggestion | `removeSuggestion()` | ❌ | 🔴 Not exposed |

**Suggestion Sources:** `persons` | `reports` | `files`

### 1.16 Visualizations (Network Graphs)

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add visualization | `addVisualization()` | ❌ | 🔴 Not exposed |
| Remove visualization | `removeVisualization()` | ❌ | 🔴 Not exposed |

**Node Types:** `folder` | `organization` | `person` | `address`

### 1.17 Activities (Audit Trail)

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Get activities | `folder.activities` | `get_case_activity` | ✅ Available |
| Add activity | `addActivity()` | ❌ | 🔴 Not exposed |

### 1.18 Location

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Update location | `updateLocation()` | via `edit_case` | ⚠️ Partial |

### 1.19 Bibob Application

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Update application data | `updateApplicationData()` | `folder_submit_application` | ✅ Available |
| Complete application | `completeApplication()` | `folder_submit_application` | ✅ Available |

**Application Criteria:**
- Provided all necessary information?
- Annual Accounts
- Budgets
- Loan Agreement

---

## 2. SIGNAL CAPABILITIES

### 2.1 Core CRUD Operations

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Create signal | `createSignal()` | `signal_create` | ✅ Available |
| Read signal | `getSignalById()` | `signal_get` | ✅ Available |
| Update signal | `updateSignal()` | `signal_update` | ✅ Available |
| Delete signal | `deleteSignal()` | `signal_delete` | ✅ Available |
| List signals | `signals[]` | `signal_list` | ✅ Available |

### 2.2 Signal Types

| Type | Description |
|------|-------------|
| `bogus-scheme` | Fraudulent business activities |
| `human-trafficking` | Human trafficking investigations |
| `drug-trafficking` | Narcotics operations |
| `bibob-research` | Bibob background checks |
| `money-laundering` | Financial crime |

### 2.3 Signal Sources

| Source | Description |
|--------|-------------|
| `police` | Police reports |
| `bibob-request` | Bibob formal requests |
| `anonymous-report` | Anonymous tips |
| `municipal-department` | Municipal sources |
| `other` | Other sources |

### 2.4 Signal Notes

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add note | `addNote()` | via `signal_update` | ⚠️ Partial |
| Private notes | `isPrivate: true` | via `signal_update` | ⚠️ Partial |

### 2.5 Signal Photos

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add photo | `addPhoto()` | ❌ | 🔴 Not exposed |
| Remove photo | `removePhoto()` | ❌ | 🔴 Not exposed |

**Limits:** Max 10 photos, 10MB total

### 2.6 Signal Attachments

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Add attachment | `addAttachment()` | ❌ | 🔴 Not exposed |
| Remove attachment | `removeAttachment()` | ❌ | 🔴 Not exposed |

**Limits:** Max 5 attachments, 5MB total

### 2.7 Signal Indicators

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Update indicators | `updateIndicators()` | via `signal_update` | ⚠️ Partial |

**Indicator Structure:** Category → Subcategory hierarchical taxonomy

### 2.8 Signal-Folder Relations

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| Link to folder | `addSignalToFolder()` | `signal_add_to_folder` | ✅ Available |
| Unlink from folder | `removeSignalFromFolder()` | `signal_remove_from_folder` | ✅ Available |
| Bulk link | `addSignalsToFolder()` | ❌ | 🔴 Not exposed |
| Update relation | `updateSignalFolderRelation()` | ❌ | 🔴 Not exposed |

---

## 3. TEAM CAPABILITIES

| Operation | Platform Support | MCP Tool | Status |
|-----------|-----------------|----------|--------|
| List team members | `mockUsers[]` | `list_team_members` | ✅ Available |
| Get workload stats | computed | `list_team_members` | ✅ Available |
| Get user by ID | `getUserById()` | via `list_team_members` | ⚠️ Partial |

---

## 4. CURRENT MCP TOOLS SUMMARY

### 4.1 Case Management Tools (16)

**Read Operations (9):**
```
1. summarize_cases     - Get case overview with status breakdown
2. list_team_members   - Team with workload statistics
3. get_case_stats      - Comprehensive dashboard statistics
4. search_cases        - Search by name, status, owner, tags, findings
5. get_case_activity   - Activity timeline for a case
6. get_case_notes      - Get notes with admin filter option
7. get_overdue_cases   - Find stale cases (configurable threshold)
8. get_unassigned_cases- Find cases without an owner
9. summarize_attachments- Get file attachments with text preview
```

**Write Operations (7):**
```
1. create_case    - Create new investigation case
2. edit_case      - Update case details
3. add_note       - Add note to a case
4. assign_case    - Assign case to team member
5. unassign_case  - Remove case assignment
6. delete_case    - Delete case permanently
7. change_status  - Move case through workflow
```

### 4.2 Signal Tools (7)

```
1. signal_list           - List all signals
2. signal_get            - Get specific signal by ID
3. signal_create         - Create new signal
4. signal_update         - Update signal
5. signal_delete         - Delete signal
6. signal_add_to_folder  - Link signal to case
7. signal_remove_from_folder - Unlink signal from case
```

### 4.3 Folder Tools (6)

```
1. folder_list              - List all folders
2. folder_get               - Get specific folder by ID
3. folder_create            - Create new folder
4. folder_update            - Update folder
5. folder_delete            - Delete folder
6. folder_submit_application- Submit Bibob application
```

---

## 5. RECOMMENDED ADDITIONAL MCP TOOLS

### High Priority (Common Operations)

| Tool Name | Description | Complexity |
|-----------|-------------|------------|
| `add_finding` | Add finding with severity to case | Medium |
| `add_person_to_case` | Link person to investigation | Medium |
| `add_organization_to_case` | Link organization to case | Medium |
| `create_letter` | Generate official letter from template | Medium |
| `add_practitioner` | Add team member to case | Low |
| `share_case` | Share case with access level | Medium |

### Medium Priority (Enhanced Workflows)

| Tool Name | Description | Complexity |
|-----------|-------------|------------|
| `bulk_link_signals` | Link multiple signals to case | Medium |
| `create_visualization` | Create relationship graph | High |
| `add_signal_photo` | Add photo to signal | Medium |
| `add_signal_attachment` | Add document to signal | Medium |
| `send_chat_message` | Send message in case chat | Low |

### Lower Priority (Specialized)

| Tool Name | Description | Complexity |
|-----------|-------------|------------|
| `remove_note` | Remove note from case | Low |
| `update_indicators` | Update signal indicators | Medium |
| `manage_suggestions` | Add/remove suggestions | Low |

---

## 6. WHAT YOUR AGENT CAN DO TODAY

### Fully Supported Workflows

1. **Complete Investigation Lifecycle**
   - Create case → Assign owner → Add notes → Change status → Archive

2. **Signal Processing**
   - Create signal → Link to case → Update details → Delete

3. **Team Management**
   - View workload → Find unassigned cases → Reassign work

4. **Case Monitoring**
   - Get statistics → Find overdue cases → Review activities

5. **Search & Discovery**
   - Search by text, status, owner, tags, or findings severity

### Partially Supported (via generic edit)

- Adding tags (via `edit_case`)
- Updating location (via `edit_case`)
- Complex folder updates (via `folder_update`)

### Not Yet Supported via MCP

- Adding people/organizations/addresses to cases
- Creating official letters
- Managing findings with severity
- File uploads
- Network visualizations
- Internal chat
- Photo/attachment management for signals

---

## 7. EXAMPLE AGENT CONVERSATIONS

### What Works Today

```
User: "Show me all active cases in Research phase"
Agent: Uses summarize_cases with status=research

User: "Who has the most cases assigned?"
Agent: Uses list_team_members, analyzes workload

User: "Create a new Bibob investigation for XYZ Corp"
Agent: Uses create_case

User: "Move case folder-001 to Decision phase"
Agent: Uses change_status

User: "Find cases that haven't been updated in 30 days"
Agent: Uses get_overdue_cases with daysThreshold=30

User: "Link signal SIG-2024-001 to the trafficking case"
Agent: Uses signal_add_to_folder

User: "Add a note that we received new evidence"
Agent: Uses add_note
```

### What Requires Platform Enhancement

```
User: "Add John Smith as a person of interest to this case"
→ Requires: add_person_to_case tool

User: "Create an LBB notification letter"
→ Requires: create_letter tool

User: "Add a critical finding about money laundering"
→ Requires: add_finding tool

User: "Create a visualization showing how these entities are connected"
→ Requires: create_visualization tool
```

---

*Document Version: 1.0*
*Generated: January 2026*
*Platform: Government Case Management Platform (GCMP)*
