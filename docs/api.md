# API Reference

## Chat API

### POST /api/chat

AI-powered chat endpoint for case management operations.

**File**: `app/api/chat/route.ts`

---

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  messages: Message[];
  cases: CaseData[];
  teamMembers: TeamMember[];
}
```

#### Message

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

#### CaseData

```typescript
interface CaseData {
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
  notesCount?: number;
  activitiesCount?: number;
  attachments?: AttachmentData[];
}
```

#### AttachmentData

```typescript
interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string;      // base64 encoded
  textContent?: string;  // extracted text
}
```

#### TeamMember

```typescript
interface TeamMember {
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

### Response

**Success (200)**:
```typescript
{
  content: string;        // AI text response
  toolUses: ToolUse[];    // Tool calls made by AI
  stopReason: string;     // Why AI stopped (e.g., "end_turn", "tool_use")
}
```

#### ToolUse

```typescript
interface ToolUse {
  name: string;                      // Tool name
  input: Record<string, unknown>;    // Tool parameters
  result?: string;                   // Server-side result (for summarize_attachments)
}
```

**Error (500)**:
```typescript
{
  error: string;
}
```

---

### Example Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me all critical cases"}
    ],
    "cases": [
      {
        "id": "case-001",
        "caseNumber": "GCMP-2024-001234",
        "title": "Trafficking Investigation",
        "description": "Multi-state investigation",
        "type": "human-trafficking",
        "status": "in-progress",
        "priority": "critical",
        "assigneeName": "James Rodriguez",
        "createdAt": "2024-01-15T09:00:00Z",
        "updatedAt": "2024-03-10T14:30:00Z"
      }
    ],
    "teamMembers": [
      {
        "id": "user-001",
        "firstName": "James",
        "lastName": "Rodriguez",
        "title": "Senior Investigator",
        "role": "investigator",
        "activeCasesCount": 3,
        "maxCaseCapacity": 5
      }
    ]
  }'
```

### Example Response

```json
{
  "content": "",
  "toolUses": [
    {
      "name": "search_cases",
      "input": {
        "priority": "critical"
      }
    }
  ],
  "stopReason": "tool_use"
}
```

---

## Tool Definitions

The API defines 16 tools for Claude. See [AI Agent Documentation](./ai-agent.md) for complete tool details.

### Tool Schema Structure

```typescript
{
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: {
      [key: string]: {
        type: string;
        description: string;
        enum?: string[];
      };
    };
    required: string[];
  };
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |

---

## Error Handling

| Status | Condition | Response |
|--------|-----------|----------|
| 500 | Missing API key | `{"error": "ANTHROPIC_API_KEY is not configured"}` |
| 500 | API error | `{"error": "Failed to process chat request"}` |

---

## Rate Limiting

The API uses the Anthropic SDK directly and is subject to Anthropic's rate limits. No additional rate limiting is implemented on the server.

---

## Tool Processing

### Client-Side Tools (9)

These tools have their results processed in the chat-bot component:

- `summarize_cases`
- `list_team_members`
- `get_case_stats`
- `search_cases`
- `get_case_activity`
- `get_case_notes`
- `get_overdue_cases`
- `get_unassigned_cases`

### Server-Side Tools (1)

This tool is processed on the server with a separate Claude API call:

- `summarize_attachments` - Uses Claude's vision capabilities

### Confirmation-Required Tools (7)

These tools return the requested action but don't execute until user confirms:

- `create_case`
- `edit_case`
- `add_note`
- `assign_case`
- `unassign_case`
- `delete_case`
- `change_status`

---

## Claude Configuration

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 1024,
  system: systemPrompt,  // Contains case/team context
  tools: tools,          // 16 tool definitions
  messages: messages,    // Conversation history
});
```

### Attachment Analysis Configuration

```typescript
const summaryResponse = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze these attachments...' },
      { type: 'image', source: { type: 'base64', media_type, data } },
      // ... more images/text
    ]
  }],
});
```
