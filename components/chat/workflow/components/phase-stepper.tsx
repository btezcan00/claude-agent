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
  const currentIndex = getPhaseIndex(currentPhase);

  if (currentPhase === 'idle') {
    return null;
  }

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 border-b ${className}`}>
      {PHASE_ORDER.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={phase} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 border-blue-500 text-white' : ''}
                  ${isPending ? 'bg-white border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                {isCurrent && <Loader2 className="w-5 h-5 animate-spin" />}
                {isPending && <Circle className="w-5 h-5" />}
              </div>
              <span
                className={`
                  mt-1 text-xs font-medium
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isCurrent ? 'text-blue-600' : ''}
                  ${isPending ? 'text-gray-400' : ''}
                `}
              >
                {PHASE_DISPLAY_NAMES[phase]}
              </span>
            </div>

            {/* Connector line */}
            {index < PHASE_ORDER.length - 1 && (
              <div
                className={`
                  h-0.5 w-12 mx-2 transition-all duration-300
                  ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
