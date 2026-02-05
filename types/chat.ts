// Gamification Types
export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date string
}

export interface DailyProgress {
  date: string; // ISO date string
  actionsCompleted: number;
  messagesExchanged: number;
  signalsCreated: number;
  signalsEdited: number;
  casesManaged: number;
}

export type AchievementId =
  | 'first_signal'
  | 'signal_master'
  | 'case_organizer'
  | 'week_warrior'
  | 'month_champion'
  | 'note_taker'
  | 'search_expert'
  | 'team_player'
  | 'early_bird'
  | 'night_owl';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO date string when unlocked
  progress?: number; // 0-100 for partial progress
  target?: number; // Target number for countable achievements
  current?: number; // Current count for countable achievements
}

export interface GamificationState {
  streak: UserStreak;
  todayProgress: DailyProgress;
  achievements: Achievement[];
  totalActionsAllTime: number;
  totalDaysActive: number;
}

// Achievement Definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress' | 'current'>[] = [
  {
    id: 'first_signal',
    name: 'Eerste Melding',
    description: 'Je eerste melding aangemaakt',
    icon: '🎯',
    target: 1,
  },
  {
    id: 'signal_master',
    name: 'Melding Meester',
    description: '10 meldingen aangemaakt',
    icon: '🏆',
    target: 10,
  },
  {
    id: 'case_organizer',
    name: 'Dossier Organisator',
    description: '5 dossiers beheerd',
    icon: '📁',
    target: 5,
  },
  {
    id: 'week_warrior',
    name: 'Week Krijger',
    description: '7-daagse reeks behouden',
    icon: '🔥',
    target: 7,
  },
  {
    id: 'month_champion',
    name: 'Maand Kampioen',
    description: '30-daagse reeks behouden',
    icon: '👑',
    target: 30,
  },
  {
    id: 'note_taker',
    name: 'Notitie Maker',
    description: '5 notities aan meldingen toegevoegd',
    icon: '📝',
    target: 5,
  },
  {
    id: 'search_expert',
    name: 'Zoek Expert',
    description: '10 zoekopdrachten uitgevoerd',
    icon: '🔍',
    target: 10,
  },
  {
    id: 'team_player',
    name: 'Teamspeler',
    description: '3 dossiereigenaren toegewezen',
    icon: '🤝',
    target: 3,
  },
  {
    id: 'early_bird',
    name: 'Vroege Vogel',
    description: 'De assistent voor 9 uur gebruikt',
    icon: '🌅',
    target: 1,
  },
  {
    id: 'night_owl',
    name: 'Nachtuil',
    description: 'De assistent na 21 uur gebruikt',
    icon: '🦉',
    target: 1,
  },
];

// Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reactions?: MessageReaction[];
  toolUse?: {
    name: string;
    input: Record<string, unknown>;
  };
  pending?: boolean;
}

export type ReactionType = 'thumbs_up' | 'thumbs_down' | 'heart' | 'sparkles';

export interface MessageReaction {
  type: ReactionType;
  addedAt: string;
}

// Quick Actions
export type QuickActionType =
  | 'create_signal'
  | 'search_signals'
  | 'list_cases'
  | 'signal_stats'
  | 'team_members';

export interface QuickAction {
  id: QuickActionType;
  label: string;
  icon: string;
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create_signal',
    label: 'Melding Aanmaken',
    icon: '➕',
    prompt: 'Ik wil een nieuwe melding aanmaken',
  },
  {
    id: 'search_signals',
    label: 'Meldingen Zoeken',
    icon: '🔍',
    prompt: 'Zoek naar meldingen',
  },
  {
    id: 'list_cases',
    label: 'Dossiers Bekijken',
    icon: '📁',
    prompt: 'Toon alle dossiers',
  },
  {
    id: 'signal_stats',
    label: 'Statistieken',
    icon: '📊',
    prompt: 'Toon meldingstatistieken',
  },
  {
    id: 'team_members',
    label: 'Team',
    icon: '👥',
    prompt: 'Toon teamleden',
  },
];

// Avatar Expression Types
export type AvatarExpression = 'neutral' | 'thinking' | 'happy' | 'celebrating' | 'concerned';

// Contextual Suggestion Types
export interface ContextualSuggestion {
  label: string;
  prompt: string;
}

// Action types for tracking
export type TrackedActionType =
  | 'signal_created'
  | 'signal_edited'
  | 'signal_deleted'
  | 'note_added'
  | 'case_assigned'
  | 'case_edited'
  | 'search_performed'
  | 'message_sent';
