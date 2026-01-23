# Workflow Architecture Visualization

This document contains Mermaid diagrams visualizing the Agent Conversation Workflow architecture. These diagrams can be viewed directly on GitHub, copied into Notion/Confluence, or exported as images for presentations.

---

## 1. Main State Machine Flow

This diagram shows the 5 phases of the conversation workflow with transition conditions and loop-backs.

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> CLARIFICATION: User asks complex question

    CLARIFICATION --> CLARIFICATION: Missing info
    CLARIFICATION --> PLANNING: All questions answered

    PLANNING --> PLANNING: User feedback
    PLANNING --> EXECUTION: Plan confirmed

    EXECUTION --> REVIEW: All tasks complete

    REVIEW --> IDLE: Exit
    REVIEW --> CLARIFICATION: New task requested
```

### Phase Descriptions

| Phase | Description | Entry Condition | Exit Condition |
|-------|-------------|-----------------|----------------|
| **IDLE** | Initial state, waiting for user input | System start or workflow reset | User submits complex question |
| **CLARIFICATION** | Agent asks questions to understand requirements | Complex question detected | All necessary information gathered |
| **PLANNING** | Agent creates execution plan for user review | Clarification complete | User confirms the plan |
| **EXECUTION** | Agent executes tasks with live progress | Plan confirmed | All tasks complete |
| **REVIEW** | Summary and next steps | Execution complete | User exits or starts new task |

---

## 2. User-Agent Interaction Sequence

This sequence diagram shows the back-and-forth communication between User and Agent through each workflow phase.

```mermaid
sequenceDiagram
    participant U as User
    participant A as Agent
    participant S as System

    rect rgb(240, 248, 255)
        Note over U,A: CLARIFICATION PHASE
        U->>A: Asks complex question
        A->>A: Analyzes complexity
        A->>U: Asks clarifying questions
        U->>A: Provides answers
    end

    rect rgb(255, 250, 240)
        Note over U,A: PLANNING PHASE
        A->>A: Generates execution plan
        A->>U: Shows plan for review
        U->>A: Gives feedback / Confirms
    end

    rect rgb(240, 255, 240)
        Note over U,S: EXECUTION PHASE
        A->>S: Executes tasks
        S-->>U: Live progress updates
        S-->>A: Task completion status
    end

    rect rgb(255, 240, 245)
        Note over U,A: REVIEW PHASE
        A->>U: Shows completion summary
        U->>A: New task OR Exit
    end
```

### Interaction Patterns

- **Clarification**: Iterative Q&A until requirements are clear
- **Planning**: Collaborative plan refinement with user feedback
- **Execution**: Real-time visibility into task progress
- **Review**: Summary presentation and decision point

---

## 3. Component Architecture

This diagram shows how the React components, context providers, and hooks connect together.

```mermaid
flowchart TB
    subgraph Providers["Context Providers"]
        GP[GamificationProvider]
        WP[WorkflowProvider]
    end

    subgraph Context["Workflow Context"]
        WC[WorkflowContext]
        WS[WorkflowState]
    end

    subgraph Hooks["Custom Hooks"]
        UW[useWorkflow]
        UPD[usePhaseDetection]
        UTE[useTaskExecutor]
    end

    subgraph PhaseViews["Phase-Specific Views"]
        CV[ClarificationView]
        PV[PlanningView]
        EV[ExecutionView]
        RV[ReviewView]
    end

    subgraph SharedComponents["Shared UI Components"]
        PS[PhaseStepper]
        TL[TaskList]
        PT[ProgressTracker]
        FI[FeedbackInput]
    end

    GP --> WP
    WP --> WC
    WC --> WS
    WS --> UW

    UW --> CV
    UW --> PV
    UW --> EV
    UW --> RV

    UPD --> CV
    UTE --> EV

    CV --> PS
    CV --> FI
    PV --> PS
    PV --> TL
    EV --> PS
    EV --> TL
    EV --> PT
    RV --> PS
    RV --> TL
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **WorkflowProvider** | Manages global workflow state and phase transitions |
| **WorkflowContext** | Provides state and actions to child components |
| **useWorkflow** | Hook for accessing workflow state and actions |
| **usePhaseDetection** | Automatically detects when phase transitions should occur |
| **useTaskExecutor** | Handles task execution with progress tracking |
| **PhaseStepper** | Visual indicator of current workflow phase |
| **TaskList** | Displays tasks with status and progress |
| **ProgressTracker** | Shows real-time execution progress |
| **FeedbackInput** | Captures user feedback during clarification/planning |

---

## 4. Data Flow Diagram

This diagram shows how data flows through the system during a workflow session.

```mermaid
flowchart LR
    subgraph Input
        UI[User Input]
        AI[Agent Response]
    end

    subgraph Processing
        PD[Phase Detection]
        SM[State Machine]
        TE[Task Executor]
    end

    subgraph State
        WS[Workflow State]
        TQ[Task Queue]
        HL[History Log]
    end

    subgraph Output
        PV[Phase View]
        PR[Progress Display]
        SU[Summary]
    end

    UI --> PD
    AI --> PD
    PD --> SM
    SM --> WS
    WS --> PV

    SM --> TQ
    TQ --> TE
    TE --> PR
    TE --> WS

    WS --> HL
    HL --> SU
```

---

## 5. Phase Transition Rules

This diagram details the specific conditions that trigger phase transitions.

```mermaid
flowchart TD
    subgraph IDLE
        I1[Waiting for input]
    end

    subgraph CLARIFICATION
        C1{All questions<br/>answered?}
        C2[Ask next question]
    end

    subgraph PLANNING
        P1{User confirmed<br/>plan?}
        P2[Update plan with feedback]
    end

    subgraph EXECUTION
        E1{All tasks<br/>complete?}
        E2[Execute next task]
    end

    subgraph REVIEW
        R1{New task<br/>requested?}
        R2[Show summary]
    end

    I1 -->|Complex question| C1
    I1 -->|Simple question| E1

    C1 -->|No| C2
    C2 --> C1
    C1 -->|Yes| P1

    P1 -->|No - feedback| P2
    P2 --> P1
    P1 -->|Yes| E1

    E1 -->|No| E2
    E2 --> E1
    E1 -->|Yes| R2

    R2 --> R1
    R1 -->|Yes| C1
    R1 -->|No - exit| I1
```

---

## Usage Instructions

### Viewing on GitHub
Simply navigate to this file on GitHub - Mermaid diagrams render automatically.

### Exporting as Images
1. Use [Mermaid Live Editor](https://mermaid.live/) - paste diagram code and export
2. Use VS Code with Mermaid extension for local rendering
3. Use browser dev tools to screenshot rendered diagrams on GitHub

### Copying to Notion/Confluence
- **Notion**: Use `/code` block and select Mermaid language
- **Confluence**: Use Mermaid macro or code block with Mermaid support

### Presentation Tools
- Export as PNG/SVG from Mermaid Live Editor
- Embed in Google Slides, PowerPoint, or Keynote
