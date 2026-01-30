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
    <div className={`flex items-center justify-center gap-1 px-2 py-2 bg-gray-50 border-b ${className}`}>
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
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 border-blue-500 text-white' : ''}
                  ${isPending ? 'bg-white border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                {isCurrent && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending && <Circle className="w-4 h-4" />}
              </div>
              <span
                className={`
                  mt-0.5 text-[10px] font-medium whitespace-nowrap
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isCurrent ? 'text-blue-600' : ''}
                  ${isPending ? 'text-gray-400' : ''}
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
                  ${isComplete || index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
