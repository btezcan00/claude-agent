'use client';

import { Flame, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamification } from './gamification-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgressIndicatorProps {
  compact?: boolean;
  className?: string;
}

export function ProgressIndicator({
  compact = false,
  className,
}: ProgressIndicatorProps) {
  const { state, getUnlockedAchievements } = useGamification();
  const { streak, todayProgress } = state;
  const unlockedCount = getUnlockedAchievements().length;

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2 text-xs', className)}>
          {/* Streak */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200">
                <Flame className="w-3 h-3" />
                <span>{streak.currentStreak}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{streak.currentStreak}-day streak</p>
              <p className="text-xs text-muted-foreground">
                Best: {streak.longestStreak} days
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Today's actions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">
                <Zap className="w-3 h-3" />
                <span>{todayProgress.actionsCompleted}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{todayProgress.actionsCompleted} actions today</p>
              <p className="text-xs text-muted-foreground">
                {todayProgress.signalsCreated} signals created
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Achievements */}
          {unlockedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-200">
                  <Trophy className="w-3 h-3" />
                  <span>{unlockedCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{unlockedCount} achievements unlocked</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-2 rounded-lg bg-muted/50',
        className
      )}
    >
      {/* Streak */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-medium">{streak.currentStreak} days</p>
          <p className="text-xs text-muted-foreground">Current streak</p>
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-border" />

      {/* Today's progress */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium">{todayProgress.actionsCompleted}</p>
          <p className="text-xs text-muted-foreground">Actions today</p>
        </div>
      </div>

      {/* Achievements */}
      {unlockedCount > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium">{unlockedCount}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
