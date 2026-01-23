/**
 * Chat Feature Configuration
 * Toggle features on/off for the chat experience
 */

export interface ChatFeatureConfig {
  // Personality features
  personality: {
    enabled: boolean;
    timeAwareGreetings: boolean;
    variedAcknowledgments: boolean;
    lightHumor: boolean;
  };

  // Gamification features
  gamification: {
    enabled: boolean;
    streaks: boolean;
    progressCounters: boolean;
    achievements: boolean;
  };

  // Interactive features
  interactive: {
    quickActionChips: boolean;
    messageReactions: boolean;
    contextualSuggestions: boolean;
    copyButton: boolean;
  };

  // Animation features
  animations: {
    enabled: boolean;
    typingIndicator: boolean;
    messageTransitions: boolean;
    celebrationEffects: boolean;
    avatarExpressions: boolean;
  };

  // Workflow features
  workflow: {
    enabled: boolean;
    autoDetectComplexRequests: boolean;
    showPhaseStepper: boolean;
    persistToSession: boolean;
  };
}

// Default configuration - all features enabled
export const DEFAULT_CHAT_CONFIG: ChatFeatureConfig = {
  personality: {
    enabled: true,
    timeAwareGreetings: true,
    variedAcknowledgments: true,
    lightHumor: true,
  },
  gamification: {
    enabled: true,
    streaks: true,
    progressCounters: true,
    achievements: true,
  },
  interactive: {
    quickActionChips: true,
    messageReactions: true,
    contextualSuggestions: true,
    copyButton: true,
  },
  animations: {
    enabled: true,
    typingIndicator: true,
    messageTransitions: true,
    celebrationEffects: true,
    avatarExpressions: true,
  },
  workflow: {
    enabled: true,
    autoDetectComplexRequests: true,
    showPhaseStepper: true,
    persistToSession: true,
  },
};

// Minimal configuration - for performance-sensitive environments
export const MINIMAL_CHAT_CONFIG: ChatFeatureConfig = {
  personality: {
    enabled: true,
    timeAwareGreetings: true,
    variedAcknowledgments: false,
    lightHumor: false,
  },
  gamification: {
    enabled: false,
    streaks: false,
    progressCounters: false,
    achievements: false,
  },
  interactive: {
    quickActionChips: true,
    messageReactions: false,
    contextualSuggestions: false,
    copyButton: true,
  },
  animations: {
    enabled: false,
    typingIndicator: false,
    messageTransitions: false,
    celebrationEffects: false,
    avatarExpressions: false,
  },
  workflow: {
    enabled: false,
    autoDetectComplexRequests: false,
    showPhaseStepper: false,
    persistToSession: false,
  },
};

// Current active configuration
export const CHAT_CONFIG: ChatFeatureConfig = DEFAULT_CHAT_CONFIG;
