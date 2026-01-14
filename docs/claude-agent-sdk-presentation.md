---
marp: true
theme: default
paginate: true
backgroundColor: #fff
---

# Claude Agent SDK
## For Government Case Management

**Research Report & Recommendations**

*Prepared for: Software Agency*
*Project: Municipality Case Management AI Agent*

---

# Executive Summary

## Question
Is Claude Agent SDK suitable for building an AI agent for government municipality case management with **real backend integration**?

## Answer
**Yes** - Claude Agent SDK + MCP (Model Context Protocol) is the recommended approach

---

# What is Claude Agent SDK?

- **Official toolkit** from Anthropic for building AI agents
- Same infrastructure that powers **Claude Code**
- Released: **September 2025**
- Available in: **Python** and **TypeScript**

> "Give your agents a computer, allowing them to work like humans do."

---

# Key Features

| Feature | Description |
|---------|-------------|
| **Tool Use** | Define custom tools Claude can invoke |
| **Agent Loop** | Multi-step autonomous task execution |
| **Context Management** | Automatic compaction prevents token exhaustion |
| **Subagents** | Parallel task execution |
| **MCP Integration** | Connect to external APIs & databases |
| **Verification** | Built-in reliability mechanisms |

---

# What Can You Build?

1. **Finance Agents**
   - Access external APIs, run calculations

2. **Personal Assistant Agents**
   - Book travel, manage calendars

3. **Customer Support Agents**
   - Handle tickets, escalate to humans

4. **Case Management Agents** *(Your Use Case)*
   - CRUD operations, assignments, document analysis

---

# Advanced Tool Use (2025)

## Three Key Features

1. **Tool Search Tool**
   - Discover from thousands of tools dynamically
   - Doesn't consume context window

2. **Programmatic Tool Calling**
   - Invoke tools in code execution environment
   - Chain tools programmatically

3. **Tool Use Examples**
   - Standardized demonstrations
   - Better reliability

---

# MCP - Model Context Protocol

## What is it?
An **open standard** for connecting AI models to external systems

## Why does it matter?
- Standardized backend integration
- No custom code for each API
- Built-in authentication handling
- Enterprise audit trails

---

# MCP Architecture

```
┌──────────────────────────────────────────┐
│           Your Application                │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────┐    ┌─────────────────┐  │
│  │   Claude   │◀──▶│   MCP Server    │  │
│  │   Agent    │    │ (Your Adapter)  │  │
│  └────────────┘    └─────────────────┘  │
│                           │              │
│                           ▼              │
│               ┌─────────────────────┐   │
│               │  Government APIs    │   │
│               │  - Cases            │   │
│               │  - Documents        │   │
│               │  - Users            │   │
│               └─────────────────────┘   │
└──────────────────────────────────────────┘
```

---

# Government Case Management Fit

| Requirement | SDK Solution |
|-------------|-------------|
| Real backend API calls | MCP connects to REST/GraphQL |
| Case CRUD operations | Custom tools for each operation |
| User authentication | MCP + Government SSO |
| Audit logging | Built-in audit trail support |
| Document handling | Agent Skills (PDF, Word, Excel) |
| Human escalation | Confirmation workflows |

---

# Recommended Architecture

```
Frontend (React/Next.js)
         │
         ▼
Agent API Server (Claude Agent SDK)
         │
         ▼
MCP Server (Backend Adapter)
  - create_case  → POST /api/cases
  - get_case     → GET /api/cases/{id}
  - search_cases → GET /api/cases?q=...
  - assign_case  → POST /api/cases/{id}/assign
         │
         ▼
Government Backend (Database, LDAP, Storage)
```

---

# Demo vs Production

| Aspect | Current Demo | Production |
|--------|--------------|------------|
| Storage | localStorage | Government DB |
| Backend | None | Real REST APIs |
| API Calls | Direct Anthropic | SDK → MCP → Backend |
| Tools | Client-side | Server-side |
| Auth | Mock user | Government SSO |
| Audit | None | Full logging |

---

# Security & Compliance

## Security
- All operations run **server-side**
- API keys never exposed to frontend
- MCP supports comprehensive logging
- Permission control per tool

## Compliance
- AWS Bedrock / Google Vertex for data residency
- Human oversight with confirmation workflows
- PII handling configuration

---

# Cost Management

| Strategy | Benefit |
|----------|---------|
| Context Management | Prevents runaway token costs |
| Response Caching | Reduce API calls for common queries |
| Rate Limiting | Control per user/session |
| Token Budgets | Set limits per request |

---

# Recommendations

## Should You Use Claude Agent SDK?

**Yes** - For these reasons:

1. **Production-ready** - Powers Claude Code
2. **MCP for APIs** - Standardized integration
3. **Enterprise features** - Audit, auth, governance
4. **Active development** - Anthropic continues adding features
5. **Multi-language** - Python & TypeScript

---

# Alternative Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Claude Agent SDK + MCP** | Full-featured, production-ready | Learning curve |
| **Direct Anthropic API** | Simpler, more control | Build everything yourself |
| **LangChain/LangGraph** | Multi-model support | More complex |

**Recommendation:** Claude Agent SDK + MCP

---

# Next Steps

1. **Prototype**
   Build proof-of-concept with Claude Agent SDK

2. **MCP Server**
   Create adapter for one government API endpoint

3. **Security Review**
   Assess compliance requirements

4. **Pilot**
   Test with limited user group

5. **Scale**
   Expand tools and user access

---

# Sources

- [Building agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Agent SDK Overview - Claude Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [MCP in the SDK](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Claude Agent SDK on npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)

---

# Questions?

## Contact
*Your Software Agency*

## Resources
- Full research report: `docs/claude-agent-sdk-research.md`
- Platform documentation: `docs/README.md`
