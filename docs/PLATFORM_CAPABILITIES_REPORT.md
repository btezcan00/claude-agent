# Claude Agent SDK Demo - Platform Capabilities Report

**Government Case Management Platform (GCMP)**
*Demonstration of AI-Powered Investigation Management*

---

## Executive Summary

This report presents the capabilities of a Government Case Management Platform designed for law enforcement investigations. The platform demonstrates how Claude can be integrated as an AI assistant to help manage complex investigation workflows including Bibob checks, fraud investigations, trafficking cases, and more.

**Key Highlights:**
- 29 MCP tools available for Claude integration
- 16 case-focused tools (9 read, 7 write operations)
- 5-stage workflow management (Application → Research → National Office → Decision → Archive)
- Full team workload visibility and case assignment
- Document analysis and relationship visualization

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Technology Stack](#2-technology-stack)
3. [Available MCP Tools](#3-available-mcp-tools)
4. [Evaluation Tasks by Difficulty](#4-evaluation-tasks-by-difficulty)
5. [Demo Scenarios](#5-demo-scenarios)
6. [Platform Features](#6-platform-features)
7. [Evaluation Metrics](#7-evaluation-metrics)
8. [Getting Started](#8-getting-started)

---

## 1. Platform Overview

### What This Platform Is

A **Government Case Management Platform** designed for managing law enforcement investigations including:

- **Bibob checks** - Background investigations for permits/licenses
- **Fraud investigations** - Financial crime detection
- **Human trafficking cases** - Priority investigations
- **Drug trafficking operations** - Narcotics enforcement
- **Money laundering** - Financial crime tracking

### Core Entities

| Entity | Description |
|--------|-------------|
| **Cases (Folders)** | Investigation containers with workflow status, findings, and documentation |
| **Signals** | Tips, reports, and intelligence that may trigger investigations |
| **People** | Individuals involved in or related to investigations |
| **Organizations** | Companies, entities under investigation |
| **Addresses** | Locations relevant to cases |
| **Findings** | Investigation conclusions with severity ratings |
| **Letters** | Official correspondence (LBB notifications, Bibob requests) |

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.1.1, React 19.2.3, TypeScript |
| **UI Components** | Radix UI, Tailwind CSS 4.x, Lucide Icons |
| **State Management** | React Context API |
| **Backend** | Next.js API Routes, In-memory Store |
| **AI Integration** | MCP Server (Model Context Protocol) |
| **Visualization** | @xyflow/react (network graphs) |
| **Documents** | pdfjs-dist (PDF processing) |

---

## 3. Available MCP Tools

### Total: 29 Tools

### 3.1 Case Management Tools (16 tools)

#### Read Operations (9 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `summarize_cases` | Get case/folder overview with status breakdown | `status?`, `limit?` |
| `list_team_members` | Team members with workload statistics | None |
| `get_case_stats` | Comprehensive dashboard statistics | None |
| `search_cases` | Search by filters | `query?`, `status?`, `ownerId?`, `tag?`, `hasFindings?`, `hasCriticalFindings?` |
| `get_case_activity` | Activity timeline for a case | `caseId`, `limit?` |
| `get_case_notes` | Get notes for a case | `caseId`, `includeAdminOnly?` |
| `get_overdue_cases` | Find stale/overdue cases | `daysThreshold?`, `status?` |
| `get_unassigned_cases` | Find cases without owner | `status?` |
| `summarize_attachments` | Get file attachments with text preview | `caseId` |

#### Write Operations (7 tools - Require Confirmation)

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_case` | Create new investigation case | `name`, `description`, `ownerId?`, `color?`, `icon?`, `signalIds?` |
| `edit_case` | Update case details | `caseId`, `name?`, `description?`, `color?`, `icon?`, `tags?` |
| `add_note` | Add note to a case | `caseId`, `content`, `isAdminOnly?` |
| `assign_case` | Assign case to team member | `caseId`, `userId`, `userName` |
| `unassign_case` | Remove case assignment | `caseId` |
| `delete_case` | Delete case permanently | `caseId` |
| `change_status` | Move case through workflow | `caseId`, `status` |

### 3.2 Signal Tools (7 tools)

| Tool | Description |
|------|-------------|
| `signal_list` | List all signals |
| `signal_get` | Get specific signal by ID |
| `signal_create` | Create new signal |
| `signal_update` | Update signal |
| `signal_delete` | Delete signal |
| `signal_add_to_folder` | Link signal to case |
| `signal_remove_from_folder` | Unlink signal from case |

### 3.3 Folder Tools (6 tools)

| Tool | Description |
|------|-------------|
| `folder_list` | List all folders |
| `folder_get` | Get specific folder by ID |
| `folder_create` | Create new folder |
| `folder_update` | Update folder |
| `folder_delete` | Delete folder |
| `folder_submit_application` | Submit Bibob application |

---

## 4. Evaluation Tasks by Difficulty

### Easy Tasks (Single-step, Read-only)

| Task | Description | Tool(s) Used |
|------|-------------|--------------|
| List all folders by status | Get folders in Application, Research, Decision stages | `summarize_cases` |
| Get team workload | Show which team members have most cases | `list_team_members` |
| Find unassigned cases | List cases without an owner | `get_unassigned_cases` |
| Summarize a signal | Read a signal and provide summary | `signal_get` |
| List findings by severity | Get critical vs low severity findings | `search_cases` with `hasCriticalFindings` |

### Medium Tasks (Multi-step, Single Entity)

| Task | Description | Tool(s) Used |
|------|-------------|--------------|
| Create a new folder | Create folder with name, description, tags | `create_case` |
| Add a finding to folder | Select type, assign user, set severity | `edit_case` |
| Move folder through workflow | Change status Application → Research → Decision | `change_status` |
| Generate a letter | Create LBB notification with filled fields | `folder_update` |
| Analyze an attachment | Upload PDF and extract key information | `summarize_attachments` |

### Hard Tasks (Multi-step, Multiple Entities)

| Task | Description | Tool(s) Used |
|------|-------------|--------------|
| Link signal to folder | Find signal, add to existing folder | `signal_get` + `signal_add_to_folder` |
| Create visualization | Add people, orgs, addresses as nodes with edges | `folder_update` |
| Complete application criteria | Check all criteria, provide explanations | `folder_submit_application` |
| Add person with organization | Create person, create org, link both to folder | Multiple entity APIs |
| Process suspicious activity | From signal → folder → findings → letter | Full workflow |

### Expert Tasks (Complex Reasoning + Automation)

| Task | Description | Tool(s) Used |
|------|-------------|--------------|
| Rebalance team workload | Analyze capacity, suggest reassignments | `list_team_members` + `assign_case` |
| Identify related cases | Find connections between signals/folders | `search_cases` + analysis |
| Generate investigation summary | Compile findings, timeline, recommendations | Multiple read tools + synthesis |
| Bulk signal processing | Categorize 10 signals by type and priority | `signal_list` + batch operations |
| Risk assessment | Analyze folder data, generate severity findings | `summarize_cases` + `edit_case` |

---

## 5. Demo Scenarios

### Scenario 1: New Investigation Setup

**User Prompt:** *"Create a new Bibob investigation for ABC Corporation"*

**Expected Agent Actions:**
1. Create folder with appropriate name/tags using `create_case`
2. Add ABC Corporation to organizations
3. Set initial status to "Application"
4. Create initial findings checklist

**Tools Used:** `create_case`, `edit_case`

---

### Scenario 2: Signal Triage

**User Prompt:** *"Process this anonymous tip about suspicious activity at Main Street 123"*

**Expected Agent Actions:**
1. Create signal with source "Anonymous" using `signal_create`
2. Set appropriate signal type
3. Add address to signal
4. Suggest creating folder if warranted

**Tools Used:** `signal_create`, `create_case`

---

### Scenario 3: Investigation Progress

**User Prompt:** *"Move the Johnson case to Research phase and add a finding"*

**Expected Agent Actions:**
1. Find the Johnson folder using `search_cases`
2. Update status to "Research" using `change_status`
3. Add appropriate finding with severity using `edit_case`
4. Activity timeline auto-updates

**Tools Used:** `search_cases`, `change_status`, `edit_case`

---

### Scenario 4: Team Workload Analysis

**User Prompt:** *"Show me which team members are overloaded and suggest reassignments"*

**Expected Agent Actions:**
1. Get team workload using `list_team_members`
2. Analyze distribution of cases
3. Identify overloaded members
4. Suggest reassignments using `assign_case`

**Tools Used:** `list_team_members`, `get_unassigned_cases`, `assign_case`

---

### Scenario 5: Case Status Report

**User Prompt:** *"Give me a summary of all active investigations and any that need attention"*

**Expected Agent Actions:**
1. Get case statistics using `get_case_stats`
2. Find overdue cases using `get_overdue_cases`
3. Identify unassigned cases using `get_unassigned_cases`
4. Compile comprehensive report

**Tools Used:** `get_case_stats`, `get_overdue_cases`, `get_unassigned_cases`, `summarize_cases`

---

## 6. Platform Features

### 6.1 Workflow Management

```
┌─────────────┐    ┌──────────┐    ┌─────────────────┐    ┌──────────┐    ┌─────────┐
│ Application │ →  │ Research │ →  │ National Office │ →  │ Decision │ →  │ Archive │
└─────────────┘    └──────────┘    └─────────────────┘    └──────────┘    └─────────┘
     Blue            Orange              Purple              Green           Gray
```

### 6.2 Signal Types

| Type | Description |
|------|-------------|
| Bogus Schemes | Fraudulent business activities |
| Human Trafficking | Priority trafficking cases |
| Drug Trafficking | Narcotics operations |
| Bibob Research | Background investigations |
| Money Laundering | Financial crime |

### 6.3 Signal Sources

- Police reports
- Bibob requests
- Anonymous tips
- Municipal departments
- Other sources

### 6.4 Finding Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| None | Gray | No significant findings |
| Low | Blue | Minor concerns |
| Serious | Orange | Significant issues |
| Critical | Red | Urgent attention required |

### 6.5 Letter Templates

1. **LBB Notification Letter** - Official notifications under Dutch law
2. **Bibob Article 7c Request** - Tax Authority information requests

### 6.6 Access Levels

| Level | Permissions |
|-------|-------------|
| View | Read-only access to case |
| Edit | Can modify case and add signals |
| Admin | Full access including sharing |

---

## 7. Evaluation Metrics

| Metric | Description | How to Measure |
|--------|-------------|----------------|
| **Task Completion** | Did agent complete the requested task? | Binary (Yes/No) |
| **Accuracy** | Did agent use correct data/entities? | Compare output to expected |
| **Efficiency** | How many tool calls to complete? | Count tool invocations |
| **Error Handling** | How did agent handle invalid inputs? | Test edge cases |
| **Context Usage** | Did agent use available context correctly? | Review reasoning |
| **Tool Selection** | Did agent choose appropriate tools? | Evaluate tool choices |
| **Confirmation Compliance** | Did agent respect write-operation confirmations? | Check for proper flow |

### Scoring Rubric

| Score | Description |
|-------|-------------|
| 5 | Perfect execution, optimal tool selection |
| 4 | Task completed with minor inefficiencies |
| 3 | Task completed with workarounds needed |
| 2 | Partial completion, significant issues |
| 1 | Failed to complete task |

---

## 8. Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd claude-agent

# Install dependencies
npm install

# Build MCP server
cd mcp-server && npm run build && cd ..

# Start development server
npm run dev
```

### MCP Configuration

The `.mcp.json` file configures the MCP server:

```json
{
  "mcpServers": {
    "signal-folder-api": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "env": {
        "API_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Running the Demo

1. Start the Next.js application: `npm run dev`
2. The MCP server connects to `http://localhost:3000`
3. Claude can now use all 29 tools to interact with the platform

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/folders` | GET, POST | List/create folders |
| `/api/folders/[id]` | GET, PUT, DELETE | CRUD single folder |
| `/api/folders/[id]/application` | PUT | Submit Bibob application |
| `/api/folders/stats` | GET | Folder statistics |
| `/api/signals` | GET, POST | List/create signals |
| `/api/signals/[id]` | GET, PUT, DELETE | CRUD single signal |
| `/api/signals/[id]/folder-relations` | POST | Link signal to folder |
| `/api/team-members` | GET | Team with workload |
| `/api/organizations` | GET, POST | Organizations |
| `/api/addresses` | GET, POST | Addresses |
| `/api/people` | GET, POST | People |
| `/api/people/brp` | POST | BRP lookup |

---

## Appendix: Sample API Responses

### Team Members Response

```json
{
  "teamMembers": [
    {
      "id": "user-001",
      "name": "Sarah Mitchell",
      "role": "supervisor",
      "workload": {
        "totalFolders": 1,
        "activeCases": 1,
        "foldersByStatus": {
          "application": 0,
          "research": 1,
          "national_office": 0,
          "decision": 0,
          "archive": 0
        }
      }
    }
  ],
  "summary": {
    "totalMembers": 5,
    "activeMembers": 5
  }
}
```

### Case Stats Response

```json
{
  "total": 3,
  "byStatus": {
    "application": 1,
    "research": 1,
    "national_office": 1,
    "decision": 0,
    "archive": 0
  },
  "findings": {
    "total": 0,
    "critical": 0,
    "serious": 0
  },
  "assigned": 2,
  "unassigned": 1
}
```

---

*Report generated for Claude Agent SDK Demo presentation*
*Version 1.0 - January 2026*
