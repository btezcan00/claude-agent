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
  foldersManaged: number;
}

export type AchievementId =
  | 'first_signal'
  | 'signal_master'
  | 'folder_organizer'
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
    name: 'First Signal',
    description: 'Created your first signal',
    icon: '🎯',
    target: 1,
  },
  {
    id: 'signal_master',
    name: 'Signal Master',
    description: 'Created 10 signals',
    icon: '🏆',
    target: 10,
  },
  {
    id: 'folder_organizer',
    name: 'Folder Organizer',
    description: 'Managed 5 folders',
    icon: '📁',
    target: 5,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    target: 7,
  },
  {
    id: 'month_champion',
    name: 'Month Champion',
    description: 'Maintained a 30-day streak',
    icon: '👑',
    target: 30,
  },
  {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'Added 5 notes to signals',
    icon: '📝',
    target: 5,
  },
  {
    id: 'search_expert',
    name: 'Search Expert',
    description: 'Performed 10 signal searches',
    icon: '🔍',
    target: 10,
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Assigned 3 folder owners',
    icon: '🤝',
    target: 3,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Used the assistant before 9 AM',
    icon: '🌅',
    target: 1,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Used the assistant after 9 PM',
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
  | 'list_folders'
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
    label: 'Create Signal',
    icon: '➕',
    prompt: 'I want to create a new signal',
  },
  {
    id: 'search_signals',
    label: 'Search Signals',
    icon: '🔍',
    prompt: 'Search for signals',
  },
  {
    id: 'list_folders',
    label: 'View Folders',
    icon: '📁',
    prompt: 'List all folders',
  },
  {
    id: 'signal_stats',
    label: 'Statistics',
    icon: '📊',
    prompt: 'Show me signal statistics',
  },
  {
    id: 'team_members',
    label: 'Team',
    icon: '👥',
    prompt: 'Show team members',
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
  | 'folder_assigned'
  | 'folder_edited'
  | 'search_performed'
  | 'message_sent';
