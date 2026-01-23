// Phase Transition Logic
// Manages valid state transitions in the conversation workflow

import { ConversationPhase, PhaseTransitionEvent } from '@/types/conversation-workflow';

// Valid transitions map: from -> event -> to
const TRANSITION_MAP: Record<ConversationPhase, Partial<Record<PhaseTransitionEvent, ConversationPhase>>> = {
  idle: {
    START_WORKFLOW: 'clarification',
  },
  clarification: {
    REQUIREMENTS_COMPLETE: 'planning',
    EXIT_WORKFLOW: 'idle',
  },
  planning: {
    PLAN_CONFIRMED: 'execution',
    GO_BACK: 'clarification',
    EXIT_WORKFLOW: 'idle',
  },
  execution: {
    EXECUTION_COMPLETE: 'review',
    // Note: No GO_BACK from execution - must complete or cancel
  },
  review: {
    REQUEST_NEW_TASK: 'clarification',
    EXIT_WORKFLOW: 'idle',
  },
};

// Check if a transition is valid
export function canTransition(
  from: ConversationPhase,
  event: PhaseTransitionEvent
): boolean {
  const validTransitions = TRANSITION_MAP[from];
  return validTransitions !== undefined && event in validTransitions;
}

// Get the next phase for a given event
export function getNextPhase(
  current: ConversationPhase,
  event: PhaseTransitionEvent
): ConversationPhase | null {
  const validTransitions = TRANSITION_MAP[current];
  if (!validTransitions || !(event in validTransitions)) {
    return null;
  }
  return validTransitions[event] ?? null;
}

// Get all valid events from a phase
export function getValidEvents(phase: ConversationPhase): PhaseTransitionEvent[] {
  const validTransitions = TRANSITION_MAP[phase];
  if (!validTransitions) {
    return [];
  }
  return Object.keys(validTransitions) as PhaseTransitionEvent[];
}

// Phase display names for UI
export const PHASE_DISPLAY_NAMES: Record<ConversationPhase, string> = {
  idle: 'Ready',
  clarification: 'Clarifying',
  planning: 'Planning',
  execution: 'Executing',
  review: 'Complete',
};

// Phase descriptions for UI
export const PHASE_DESCRIPTIONS: Record<ConversationPhase, string> = {
  idle: 'Ready to help with your request',
  clarification: 'Gathering requirements to understand your needs',
  planning: 'Creating a detailed execution plan',
  execution: 'Executing the planned tasks',
  review: 'Reviewing results and next steps',
};

// Phase order for stepper UI
export const PHASE_ORDER: ConversationPhase[] = [
  'clarification',
  'planning',
  'execution',
  'review',
];

// Get phase index (for stepper)
export function getPhaseIndex(phase: ConversationPhase): number {
  if (phase === 'idle') return -1;
  return PHASE_ORDER.indexOf(phase);
}

// Check if phase is before another phase
export function isPhaseBefore(
  phase: ConversationPhase,
  otherPhase: ConversationPhase
): boolean {
  const phaseIndex = getPhaseIndex(phase);
  const otherIndex = getPhaseIndex(otherPhase);
  return phaseIndex < otherIndex;
}

// Check if phase is after another phase
export function isPhaseAfter(
  phase: ConversationPhase,
  otherPhase: ConversationPhase
): boolean {
  const phaseIndex = getPhaseIndex(phase);
  const otherIndex = getPhaseIndex(otherPhase);
  return phaseIndex > otherIndex;
}

// Get previous phase (for GO_BACK)
export function getPreviousPhase(phase: ConversationPhase): ConversationPhase | null {
  const index = getPhaseIndex(phase);
  if (index <= 0) return null;
  return PHASE_ORDER[index - 1];
}

// Validate phase-specific requirements
export interface PhaseValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePhaseCompletion(
  phase: ConversationPhase,
  state: {
    questions?: { answered: number; total: number };
    plan?: { confirmed: boolean; taskCount: number };
    execution?: { completed: number; total: number; failed: number };
  }
): PhaseValidation {
  const errors: string[] = [];

  switch (phase) {
    case 'clarification':
      if (state.questions) {
        if (state.questions.answered < state.questions.total) {
          errors.push(`${state.questions.total - state.questions.answered} questions still need answers`);
        }
      }
      break;

    case 'planning':
      if (state.plan) {
        if (!state.plan.confirmed) {
          errors.push('Plan must be confirmed before execution');
        }
        if (state.plan.taskCount === 0) {
          errors.push('Plan must have at least one task');
        }
      }
      break;

    case 'execution':
      if (state.execution) {
        const remaining = state.execution.total - state.execution.completed - state.execution.failed;
        if (remaining > 0) {
          errors.push(`${remaining} tasks still pending`);
        }
      }
      break;

    case 'review':
      // Review phase can always be exited
      break;

    case 'idle':
      // No validation needed for idle
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
