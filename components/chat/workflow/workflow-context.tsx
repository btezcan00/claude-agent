'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  ConversationWorkflowState,
  ConversationPhase,
  PhaseTransitionEvent,
  WorkflowAction,
  WorkflowContextValue,
  ClarificationQuestion,
  Plan,
  PlanTask,
  ReviewItem,
  ReviewState,
  ClarificationState,
  PlanningState,
  ExecutionState,
} from '@/types/conversation-workflow';
import {
  canTransition as checkCanTransition,
  getNextPhase,
  getPreviousPhase,
} from '@/lib/workflow/phase-transitions';

const STORAGE_KEY = 'gcmp-workflow';

// Default states for each phase
const defaultClarificationState: ClarificationState = {
  questions: [],
  currentQuestionIndex: 0,
  isComplete: false,
  originalRequest: '',
};

const defaultPlanningState: PlanningState = {
  currentPlan: null,
  isConfirmed: false,
  userFeedback: [],
};

const defaultExecutionState: ExecutionState = {
  progress: {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    currentTaskId: null,
    percentage: 0,
  },
  isPaused: false,
  isCancelled: false,
  taskResults: {},
};

const defaultReviewState: ReviewState = {
  items: [],
  overallStatus: 'success',
  summary: '',
  nextActions: [],
};

const defaultState: ConversationWorkflowState = {
  phase: 'idle',
  sessionId: '',
  startedAt: '',
  clarification: defaultClarificationState,
  planning: defaultPlanningState,
  execution: defaultExecutionState,
  review: defaultReviewState,
};

// Generate unique session ID
function generateSessionId(): string {
  return `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Reducer function
function workflowReducer(
  state: ConversationWorkflowState,
  action: WorkflowAction
): ConversationWorkflowState {
  switch (action.type) {
    case 'START_WORKFLOW':
      return {
        ...defaultState,
        phase: 'clarification',
        sessionId: action.payload.sessionId,
        startedAt: new Date().toISOString(),
        clarification: {
          ...defaultClarificationState,
          originalRequest: action.payload.originalRequest,
        },
      };

    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload,
      };

    case 'SET_QUESTIONS':
      return {
        ...state,
        clarification: {
          ...state.clarification,
          questions: action.payload,
          currentQuestionIndex: 0,
          isComplete: action.payload.length === 0,
        },
      };

    case 'ANSWER_QUESTION': {
      const updatedQuestions = state.clarification.questions.map((q) =>
        q.id === action.payload.questionId
          ? { ...q, answer: action.payload.answer, answeredAt: new Date().toISOString() }
          : q
      );
      const answeredCount = updatedQuestions.filter((q) => q.answer !== undefined).length;
      const currentIndex = Math.min(
        updatedQuestions.findIndex((q) => q.answer === undefined),
        updatedQuestions.length - 1
      );

      return {
        ...state,
        clarification: {
          ...state.clarification,
          questions: updatedQuestions,
          currentQuestionIndex: currentIndex >= 0 ? currentIndex : updatedQuestions.length - 1,
          isComplete: answeredCount === updatedQuestions.length,
        },
      };
    }

    case 'COMPLETE_CLARIFICATION':
      return {
        ...state,
        clarification: {
          ...state.clarification,
          isComplete: true,
        },
        phase: 'planning',
      };

    case 'SET_PLAN':
      return {
        ...state,
        planning: {
          ...state.planning,
          currentPlan: action.payload,
          isConfirmed: false,
        },
      };

    case 'UPDATE_PLAN':
      if (!state.planning.currentPlan) return state;
      return {
        ...state,
        planning: {
          ...state.planning,
          currentPlan: {
            ...state.planning.currentPlan,
            ...action.payload,
            version: state.planning.currentPlan.version + 1,
          },
          isConfirmed: false,
        },
      };

    case 'ADD_PLAN_FEEDBACK':
      return {
        ...state,
        planning: {
          ...state.planning,
          userFeedback: [...state.planning.userFeedback, action.payload],
        },
      };

    case 'CONFIRM_PLAN':
      if (!state.planning.currentPlan) return state;
      return {
        ...state,
        planning: {
          ...state.planning,
          currentPlan: {
            ...state.planning.currentPlan,
            confirmedAt: new Date().toISOString(),
          },
          isConfirmed: true,
        },
        phase: 'execution',
        execution: {
          ...defaultExecutionState,
          progress: {
            ...defaultExecutionState.progress,
            totalTasks: state.planning.currentPlan.tasks.length,
            startedAt: new Date().toISOString(),
          },
        },
      };

    case 'START_EXECUTION':
      return {
        ...state,
        phase: 'execution',
        execution: {
          ...state.execution,
          progress: {
            ...state.execution.progress,
            startedAt: new Date().toISOString(),
          },
        },
      };

    case 'UPDATE_TASK_STATUS': {
      if (!state.planning.currentPlan) return state;

      const updatedTasks = state.planning.currentPlan.tasks.map((task) =>
        task.id === action.payload.taskId
          ? {
              ...task,
              status: action.payload.status,
              result: action.payload.result,
              error: action.payload.error,
            }
          : task
      );

      const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
      const failedCount = updatedTasks.filter((t) => t.status === 'failed').length;
      const totalTasks = updatedTasks.length;

      return {
        ...state,
        planning: {
          ...state.planning,
          currentPlan: {
            ...state.planning.currentPlan,
            tasks: updatedTasks,
          },
        },
        execution: {
          ...state.execution,
          progress: {
            ...state.execution.progress,
            completedTasks: completedCount,
            failedTasks: failedCount,
            percentage: Math.round(((completedCount + failedCount) / totalTasks) * 100),
          },
          taskResults: {
            ...state.execution.taskResults,
            [action.payload.taskId]: {
              success: action.payload.status === 'completed',
              result: action.payload.result,
              error: action.payload.error,
            },
          },
        },
      };
    }

    case 'SET_CURRENT_TASK':
      return {
        ...state,
        execution: {
          ...state.execution,
          progress: {
            ...state.execution.progress,
            currentTaskId: action.payload,
          },
        },
      };

    case 'PAUSE_EXECUTION':
      return {
        ...state,
        execution: {
          ...state.execution,
          isPaused: true,
        },
      };

    case 'RESUME_EXECUTION':
      return {
        ...state,
        execution: {
          ...state.execution,
          isPaused: false,
        },
      };

    case 'CANCEL_EXECUTION':
      return {
        ...state,
        execution: {
          ...state.execution,
          isCancelled: true,
        },
        phase: 'review',
      };

    case 'COMPLETE_EXECUTION':
      return {
        ...state,
        phase: 'review',
        execution: {
          ...state.execution,
          progress: {
            ...state.execution.progress,
            completedAt: new Date().toISOString(),
          },
        },
      };

    case 'SET_REVIEW':
      return {
        ...state,
        review: {
          items: action.payload.items,
          summary: action.payload.summary,
          overallStatus: action.payload.overallStatus,
          nextActions: [],
        },
      };

    case 'REQUEST_NEW_TASK':
      return {
        ...state,
        phase: 'clarification',
        clarification: {
          ...defaultClarificationState,
          originalRequest: '',
        },
        planning: defaultPlanningState,
        execution: defaultExecutionState,
        review: defaultReviewState,
      };

    case 'EXIT_WORKFLOW':
      return defaultState;

    case 'GO_BACK': {
      const previousPhase = getPreviousPhase(state.phase);
      if (!previousPhase) return state;
      return {
        ...state,
        phase: previousPhase,
      };
    }

    case 'RESTORE_STATE':
      return action.payload;

    default:
      return state;
  }
}

// Context
const WorkflowContext = createContext<WorkflowContextValue | undefined>(undefined);

// Helper to get initial state from sessionStorage
function getInitialState(): ConversationWorkflowState {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(stored) as ConversationWorkflowState;
    return parsed;
  } catch (e) {
    console.error('Failed to parse workflow state:', e);
    return defaultState;
  }
}

// Provider component
export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, defaultState, getInitialState);

  // Track if this is the first render to skip initial save
  const isFirstRender = useRef(true);

  // Save state to sessionStorage whenever it changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Phase transition methods
  const startWorkflow = useCallback((originalRequest: string) => {
    dispatch({
      type: 'START_WORKFLOW',
      payload: { sessionId: generateSessionId(), originalRequest },
    });
  }, []);

  const transitionTo = useCallback(
    (event: PhaseTransitionEvent): boolean => {
      const nextPhase = getNextPhase(state.phase, event);
      if (!nextPhase) {
        console.warn(`Invalid transition: ${state.phase} -> ${event}`);
        return false;
      }

      switch (event) {
        case 'START_WORKFLOW':
          // Already handled by startWorkflow
          return false;
        case 'REQUIREMENTS_COMPLETE':
          dispatch({ type: 'COMPLETE_CLARIFICATION' });
          return true;
        case 'PLAN_CONFIRMED':
          dispatch({ type: 'CONFIRM_PLAN' });
          return true;
        case 'EXECUTION_COMPLETE':
          dispatch({ type: 'COMPLETE_EXECUTION' });
          return true;
        case 'REQUEST_NEW_TASK':
          dispatch({ type: 'REQUEST_NEW_TASK' });
          return true;
        case 'EXIT_WORKFLOW':
          dispatch({ type: 'EXIT_WORKFLOW' });
          return true;
        case 'GO_BACK':
          dispatch({ type: 'GO_BACK' });
          return true;
        default:
          return false;
      }
    },
    [state.phase]
  );

  const canTransition = useCallback(
    (event: PhaseTransitionEvent): boolean => {
      return checkCanTransition(state.phase, event);
    },
    [state.phase]
  );

  // Clarification methods
  const setQuestions = useCallback((questions: ClarificationQuestion[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  }, []);

  const answerQuestion = useCallback((questionId: string, answer: string | string[]) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId, answer } });
  }, []);

  const completeClarification = useCallback(() => {
    dispatch({ type: 'COMPLETE_CLARIFICATION' });
  }, []);

  // Planning methods
  const setPlan = useCallback((plan: Plan) => {
    dispatch({ type: 'SET_PLAN', payload: plan });
  }, []);

  const updatePlan = useCallback((updates: Partial<Plan>) => {
    dispatch({ type: 'UPDATE_PLAN', payload: updates });
  }, []);

  const addPlanFeedback = useCallback((feedback: string) => {
    dispatch({ type: 'ADD_PLAN_FEEDBACK', payload: feedback });
  }, []);

  const confirmPlan = useCallback(() => {
    dispatch({ type: 'CONFIRM_PLAN' });
  }, []);

  // Execution methods
  const startExecution = useCallback(() => {
    dispatch({ type: 'START_EXECUTION' });
  }, []);

  const updateTaskStatus = useCallback(
    (taskId: string, status: PlanTask['status'], result?: string, error?: string) => {
      dispatch({ type: 'UPDATE_TASK_STATUS', payload: { taskId, status, result, error } });
    },
    []
  );

  const setCurrentTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_CURRENT_TASK', payload: taskId });
  }, []);

  const pauseExecution = useCallback(() => {
    dispatch({ type: 'PAUSE_EXECUTION' });
  }, []);

  const resumeExecution = useCallback(() => {
    dispatch({ type: 'RESUME_EXECUTION' });
  }, []);

  const cancelExecution = useCallback(() => {
    dispatch({ type: 'CANCEL_EXECUTION' });
  }, []);

  const completeExecution = useCallback(() => {
    dispatch({ type: 'COMPLETE_EXECUTION' });
  }, []);

  // Review methods
  const setReview = useCallback(
    (items: ReviewItem[], summary: string, overallStatus: ReviewState['overallStatus']) => {
      dispatch({ type: 'SET_REVIEW', payload: { items, summary, overallStatus } });
    },
    []
  );

  const requestNewTask = useCallback(() => {
    dispatch({ type: 'REQUEST_NEW_TASK' });
  }, []);

  const exitWorkflow = useCallback(() => {
    dispatch({ type: 'EXIT_WORKFLOW' });
  }, []);

  // Utility
  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const isWorkflowActive = state.phase !== 'idle';

  return (
    <WorkflowContext.Provider
      value={{
        state,
        startWorkflow,
        transitionTo,
        canTransition,
        setQuestions,
        answerQuestion,
        completeClarification,
        setPlan,
        updatePlan,
        addPlanFeedback,
        confirmPlan,
        startExecution,
        updateTaskStatus,
        setCurrentTask,
        pauseExecution,
        resumeExecution,
        cancelExecution,
        completeExecution,
        setReview,
        requestNewTask,
        exitWorkflow,
        goBack,
        isWorkflowActive,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
