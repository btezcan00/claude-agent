'use client';

import { ConversationPhase } from '@/types/conversation-workflow';
import {
  PHASE_ORDER,
  PHASE_DISPLAY_NAMES,
  getPhaseIndex,
} from '@/lib/workflow/phase-transitions';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface PhaseStepperProps {
  currentPhase: ConversationPhase;
  className?: string;
}

export function PhaseStepper({ currentPhase, className = '' }: PhaseStepperProps) {
  const isComplete = currentPhase === 'complete';
  const currentIndex = getPhaseIndex(currentPhase);

  if (currentPhase === 'idle') {
    return null;
  }

  // Filter out 'complete' from display - it's not a visible step, just a state
  const visiblePhases = PHASE_ORDER.filter(p => p !== 'complete');

  return (
    <div className={`flex flex-row flex-nowrap items-center justify-center gap-1 px-3 py-2 bg-claude-beige rounded-2xl ${className}`}>
      {visiblePhases.map((phase, index) => {
        // When complete, all visible phases are completed (show checkmarks)
        const isCompleted = isComplete || index < currentIndex;
        const isCurrent = !isComplete && index === currentIndex;
        const isPending = !isComplete && index > currentIndex;

        return (
          <div key={phase} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center min-w-[52px]">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300
                  ${isCompleted ? 'bg-claude-coral border-claude-coral text-white' : ''}
                  ${isCurrent ? 'bg-claude-coral/20 border-claude-coral text-claude-coral' : ''}
                  ${isPending ? 'bg-white border-claude-beige-dark text-muted-foreground' : ''}
                `}
              >
                {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                {isCurrent && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending && <Circle className="w-4 h-4" />}
              </div>
              <span
                className={`
                  mt-0.5 text-[10px] font-medium whitespace-nowrap
                  ${isCompleted ? 'text-claude-coral' : ''}
                  ${isCurrent ? 'text-claude-coral' : ''}
                  ${isPending ? 'text-muted-foreground' : ''}
                `}
              >
                {PHASE_DISPLAY_NAMES[phase]}
              </span>
            </div>

            {/* Connector line */}
            {index < visiblePhases.length - 1 && (
              <div
                className={`
                  h-0.5 w-4 mx-0.5 transition-all duration-300
                  ${isComplete || index < currentIndex ? 'bg-claude-coral' : 'bg-claude-beige-dark'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
