'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  GamificationState,
  Achievement,
  AchievementId,
  TrackedActionType,
  ACHIEVEMENT_DEFINITIONS,
  DailyProgress,
  UserStreak,
} from '@/types/chat';
import { isEarlyBird, isNightOwl } from '../personality/greeting-variants';

const STORAGE_KEY = 'gcmp-gamification';

interface GamificationContextValue {
  state: GamificationState;
  isReturningUser: boolean;
  trackAction: (actionType: TrackedActionType) => void;
  checkAndUnlockAchievement: (achievementId: AchievementId) => boolean;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  newAchievement: Achievement | null;
  clearNewAchievement: () => void;
}

const defaultDailyProgress: DailyProgress = {
  date: new Date().toISOString().split('T')[0],
  actionsCompleted: 0,
  messagesExchanged: 0,
  signalsCreated: 0,
  signalsEdited: 0,
  foldersManaged: 0,
};

const defaultStreak: UserStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
};

const defaultState: GamificationState = {
  streak: defaultStreak,
  todayProgress: defaultDailyProgress,
  achievements: ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    current: 0,
  })),
  totalActionsAllTime: 0,
  totalDaysActive: 0,
};

const GamificationContext = createContext<GamificationContextValue | undefined>(
  undefined
);

// Helper to create fresh today state
function createTodayState(): GamificationState {
  const today = new Date().toISOString().split('T')[0];
  return {
    ...defaultState,
    streak: {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
    },
    todayProgress: {
      ...defaultDailyProgress,
      date: today,
    },
    totalDaysActive: 1,
  };
}

// Helper to compute initial state from localStorage
function getInitialState(): { state: GamificationState; isReturning: boolean } {
  if (typeof window === 'undefined') {
    return { state: defaultState, isReturning: false };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { state: createTodayState(), isReturning: false };
  }

  try {
    const parsed = JSON.parse(stored) as GamificationState;
    const today = new Date().toISOString().split('T')[0];
    const lastActive = parsed.streak.lastActiveDate;
    const updatedStreak = { ...parsed.streak };
    let isReturning = false;

    if (lastActive) {
      isReturning = true;
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, streak continues
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        updatedStreak.currentStreak += 1;
        updatedStreak.longestStreak = Math.max(
          updatedStreak.longestStreak,
          updatedStreak.currentStreak
        );
      } else {
        // Streak broken
        updatedStreak.currentStreak = 1;
      }
    } else {
      // First time user
      updatedStreak.currentStreak = 1;
      updatedStreak.longestStreak = 1;
    }

    updatedStreak.lastActiveDate = today;

    const dailyProgress =
      parsed.todayProgress.date === today
        ? parsed.todayProgress
        : { ...defaultDailyProgress, date: today };

    return {
      state: {
        ...parsed,
        streak: updatedStreak,
        todayProgress: dailyProgress,
        totalDaysActive:
          parsed.todayProgress.date !== today
            ? parsed.totalDaysActive + 1
            : parsed.totalDaysActive,
      },
      isReturning,
    };
  } catch (e) {
    console.error('Failed to parse gamification state:', e);
    return { state: createTodayState(), isReturning: false };
  }
}

export function GamificationProvider({ children }: { children: ReactNode }) {
  // Use lazy initializer for useState to compute initial state once
  const [state, setState] = useState<GamificationState>(() => getInitialState().state);
  const [isReturningUser] = useState<boolean>(() => getInitialState().isReturning);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  // Ref to track pending achievement checks
  const pendingAchievementChecks = useRef<AchievementId[]>([]);

  // Track if this is the first render to skip initial save
  const isFirstRender = useRef(true);

  // Save state to localStorage whenever it changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Process pending achievement checks
  useEffect(() => {
    if (pendingAchievementChecks.current.length > 0) {
      const checks = [...pendingAchievementChecks.current];
      pendingAchievementChecks.current = [];

      checks.forEach((achievementId) => {
        const achievement = state.achievements.find((a) => a.id === achievementId);
        if (achievement && !achievement.unlockedAt) {
          setState((prev) => {
            const updatedAchievements = prev.achievements.map((a) => {
              if (a.id !== achievementId) return a;

              const newCurrent = (a.current || 0) + 1;
              const shouldUnlock = a.target ? newCurrent >= a.target : false;

              if (shouldUnlock && !a.unlockedAt) {
                const unlockedAchievement = {
                  ...a,
                  current: newCurrent,
                  unlockedAt: new Date().toISOString(),
                  progress: 100,
                };
                setNewAchievement(unlockedAchievement);
                return unlockedAchievement;
              }

              return {
                ...a,
                current: newCurrent,
                progress: a.target ? (newCurrent / a.target) * 100 : 0,
              };
            });

            return {
              ...prev,
              achievements: updatedAchievements,
            };
          });
        }
      });
    }
  }, [state.achievements]);

  const trackAction = useCallback((actionType: TrackedActionType) => {
    setState((prev) => {
      const newProgress = { ...prev.todayProgress };
      newProgress.actionsCompleted += 1;

      switch (actionType) {
        case 'signal_created':
          newProgress.signalsCreated += 1;
          break;
        case 'signal_edited':
          newProgress.signalsEdited += 1;
          break;
        case 'folder_assigned':
        case 'folder_edited':
          newProgress.foldersManaged += 1;
          break;
        case 'message_sent':
          newProgress.messagesExchanged += 1;
          break;
      }

      return {
        ...prev,
        todayProgress: newProgress,
        totalActionsAllTime: prev.totalActionsAllTime + 1,
      };
    });

    // Queue time-based achievement checks
    if (isEarlyBird()) {
      pendingAchievementChecks.current.push('early_bird');
    }
    if (isNightOwl()) {
      pendingAchievementChecks.current.push('night_owl');
    }
  }, []);

  const checkAndUnlockAchievement = useCallback(
    (achievementId: AchievementId): boolean => {
      const achievement = state.achievements.find((a) => a.id === achievementId);
      if (!achievement || achievement.unlockedAt) {
        return false;
      }

      // Update achievement progress
      setState((prev) => {
        const updatedAchievements = prev.achievements.map((a) => {
          if (a.id !== achievementId) return a;

          const newCurrent = (a.current || 0) + 1;
          const shouldUnlock = a.target ? newCurrent >= a.target : false;

          if (shouldUnlock && !a.unlockedAt) {
            const unlockedAchievement = {
              ...a,
              current: newCurrent,
              unlockedAt: new Date().toISOString(),
              progress: 100,
            };
            setNewAchievement(unlockedAchievement);
            return unlockedAchievement;
          }

          return {
            ...a,
            current: newCurrent,
            progress: a.target ? (newCurrent / a.target) * 100 : 0,
          };
        });

        // Also check streak achievements
        let achievementsWithStreaks = updatedAchievements;
        if (prev.streak.currentStreak >= 7) {
          achievementsWithStreaks = achievementsWithStreaks.map((a) => {
            if (a.id === 'week_warrior' && !a.unlockedAt) {
              const unlocked = {
                ...a,
                unlockedAt: new Date().toISOString(),
                progress: 100,
                current: a.target,
              };
              setNewAchievement(unlocked);
              return unlocked;
            }
            return a;
          });
        }
        if (prev.streak.currentStreak >= 30) {
          achievementsWithStreaks = achievementsWithStreaks.map((a) => {
            if (a.id === 'month_champion' && !a.unlockedAt) {
              const unlocked = {
                ...a,
                unlockedAt: new Date().toISOString(),
                progress: 100,
                current: a.target,
              };
              setNewAchievement(unlocked);
              return unlocked;
            }
            return a;
          });
        }

        return {
          ...prev,
          achievements: achievementsWithStreaks,
        };
      });

      return true;
    },
    [state.achievements]
  );

  const getUnlockedAchievements = useCallback((): Achievement[] => {
    return state.achievements.filter((a) => a.unlockedAt);
  }, [state.achievements]);

  const getLockedAchievements = useCallback((): Achievement[] => {
    return state.achievements.filter((a) => !a.unlockedAt);
  }, [state.achievements]);

  const clearNewAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        state,
        isReturningUser,
        trackAction,
        checkAndUnlockAchievement,
        getUnlockedAchievements,
        getLockedAchievements,
        newAchievement,
        clearNewAchievement,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
