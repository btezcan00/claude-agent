'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement } from '@/types/chat';
import { Button } from '@/components/ui/button';

interface AchievementBadgeProps {
  achievement: Achievement;
  isNew?: boolean;
  onDismiss?: () => void;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AchievementBadge({
  achievement,
  isNew = false,
  onDismiss,
  showProgress = false,
  size = 'md',
  className,
}: AchievementBadgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress || 0;

  // Auto-dismiss after 5 seconds for new achievements
  useEffect(() => {
    if (!isNew || isDismissed) return;

    const timer = setTimeout(() => {
      setIsDismissed(true);
      onDismiss?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isNew, isDismissed, onDismiss]);

  // Compute visibility from props and local state
  const isVisible = isNew && !isDismissed;

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  // Badge display (static, for lists)
  if (!isNew) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-all',
          isUnlocked ? 'bg-muted' : 'bg-muted/50 opacity-60',
          className
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            sizeClasses[size],
            isUnlocked
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg'
              : 'bg-muted-foreground/20 grayscale'
          )}
        >
          <span className={isUnlocked ? '' : 'opacity-40'}>
            {achievement.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-sm truncate',
              !isUnlocked && 'text-muted-foreground'
            )}
          >
            {achievement.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {achievement.description}
          </p>
          {showProgress && !isUnlocked && achievement.target && (
            <div className="mt-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {achievement.current || 0} / {achievement.target}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // New achievement notification (animated popup)
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-32 right-6 z-[60] animate-in slide-in-from-right-5 fade-in duration-300',
        className
      )}
    >
      <div className="relative bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 shadow-2xl max-w-xs">
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => {
            setIsDismissed(true);
            onDismiss?.();
          }}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Achievement content */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center rounded-full animate-bounce',
              sizeClasses[size],
              'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg'
            )}
          >
            <span>{achievement.icon}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-yellow-500 uppercase tracking-wide">
              Prestatie Ontgrendeld!
            </p>
            <p className="font-semibold text-foreground">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Sparkle effect */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute top-1 left-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
          <div className="absolute top-3 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping delay-100" />
          <div className="absolute bottom-2 left-8 w-1 h-1 bg-orange-400 rounded-full animate-ping delay-200" />
        </div>
      </div>
    </div>
  );
}

// Achievement list component
interface AchievementListProps {
  achievements: Achievement[];
  showProgress?: boolean;
  className?: string;
}

export function AchievementList({
  achievements,
  showProgress = true,
  className,
}: AchievementListProps) {
  const unlockedFirst = [...achievements].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    return 0;
  });

  return (
    <div className={cn('space-y-2', className)}>
      {unlockedFirst.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          showProgress={showProgress}
          size="sm"
        />
      ))}
    </div>
  );
}
