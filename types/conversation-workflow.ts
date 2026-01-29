// Conversation Workflow Types
// State machine-driven conversation workflow for complex tasks

// Phase enum
export type ConversationPhase =
  | 'idle'
  | 'clarification'
  | 'planning'
  | 'execution'
  | 'review';

// Phase transition events
export type PhaseTransitionEvent =
  | 'START_WORKFLOW'
  | 'REQUIREMENTS_COMPLETE'
  | 'PLAN_CONFIRMED'
  | 'EXECUTION_COMPLETE'
  | 'REQUEST_NEW_TASK'
  | 'EXIT_WORKFLOW'
  | 'GO_BACK';

// Clarification Phase Types
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'confirmation' | 'multi-select';
  options?: string[];
  required: boolean;
  answer?: string | string[];
  answeredAt?: string;
}

export interface ClarificationState {
  questions: ClarificationQuestion[];
  currentQuestionIndex: number;
  isComplete: boolean;
  originalRequest: string;
}

// Planning Phase Types
export interface PlanTask {
  id: string;
  title: string;
  description: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  order: number;
  result?: string;
  error?: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  tasks: PlanTask[];
  version: number;
  confirmedAt?: string;
  feedback?: string[];
}

export interface PlanningState {
  currentPlan: Plan | null;
  isConfirmed: boolean;
  userFeedback: string[];
}

// Execution Phase Types
export interface ExecutionProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentTaskId: string | null;
  percentage: number;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecutionState {
  progress: ExecutionProgress;
  isPaused: boolean;
  isCancelled: boolean;
  taskResults: Record<string, { success: boolean; result?: string; error?: string }>;
}

// Review Phase Types
export interface ReviewItem {
  taskId: string;
  taskTitle: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  details?: string;
}

export interface ReviewState {
  items: ReviewItem[];
  overallStatus: 'success' | 'partial' | 'failed';
  summary: string;
  nextActions: string[];
}

// Complete workflow state
export interface ConversationWorkflowState {
  phase: ConversationPhase;
  sessionId: string;
  startedAt: string;
  clarification: ClarificationState;
  planning: PlanningState;
  execution: ExecutionState;
  review: ReviewState;
}

// Workflow actions for reducer
export type WorkflowAction =
  | { type: 'START_WORKFLOW'; payload: { sessionId: string; originalRequest: string } }
  | { type: 'SET_PHASE'; payload: ConversationPhase }
  | { type: 'SET_QUESTIONS'; payload: ClarificationQuestion[] }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string | string[] } }
  | { type: 'COMPLETE_CLARIFICATION' }
  | { type: 'SET_PLAN'; payload: Plan }
  | { type: 'UPDATE_PLAN'; payload: Partial<Plan> }
  | { type: 'ADD_PLAN_FEEDBACK'; payload: string }
  | { type: 'CONFIRM_PLAN' }
  | { type: 'START_EXECUTION' }
  | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; status: PlanTask['status']; result?: string; error?: string } }
  | { type: 'SET_CURRENT_TASK'; payload: string | null }
  | { type: 'PAUSE_EXECUTION' }
  | { type: 'RESUME_EXECUTION' }
  | { type: 'CANCEL_EXECUTION' }
  | { type: 'COMPLETE_EXECUTION' }
  | { type: 'SET_REVIEW'; payload: { items: ReviewItem[]; summary: string; overallStatus: ReviewState['overallStatus'] } }
  | { type: 'REQUEST_NEW_TASK' }
  | { type: 'EXIT_WORKFLOW' }
  | { type: 'GO_BACK' }
  | { type: 'RESTORE_STATE'; payload: ConversationWorkflowState };

// Workflow context value interface
export interface WorkflowContextValue {
  state: ConversationWorkflowState;
  // Phase transitions
  startWorkflow: (originalRequest: string) => void;
  transitionTo: (event: PhaseTransitionEvent) => boolean;
  canTransition: (event: PhaseTransitionEvent) => boolean;
  // Clarification methods
  setQuestions: (questions: ClarificationQuestion[]) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  completeClarification: () => void;
  // Planning methods
  setPlan: (plan: Plan) => void;
  updatePlan: (updates: Partial<Plan>) => void;
  addPlanFeedback: (feedback: string) => void;
  confirmPlan: () => void;
  // Execution methods
  startExecution: () => void;
  updateTaskStatus: (taskId: string, status: PlanTask['status'], result?: string, error?: string) => void;
  setCurrentTask: (taskId: string | null) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  cancelExecution: () => void;
  completeExecution: () => void;
  // Review methods
  setReview: (items: ReviewItem[], summary: string, overallStatus: ReviewState['overallStatus']) => void;
  requestNewTask: () => void;
  exitWorkflow: () => void;
  // Utility
  goBack: () => void;
  isWorkflowActive: boolean;
}

// Complexity analysis result from AI
export interface ComplexityAnalysis {
  isComplex: boolean;
  reason: string;
  suggestedQuestions?: ClarificationQuestion[];
}

// Plan generation result from AI
export interface PlanGenerationResult {
  plan: Plan;
  reasoning: string;
}

// Tool definitions for workflow
export interface WorkflowToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
