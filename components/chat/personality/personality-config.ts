/**
 * Personality Configuration
 * Defines character traits and response modifiers for the chat assistant
 */

// Varied acknowledgments for successful actions
export const ACKNOWLEDGMENTS = {
  success: [
    'Done!',
    'Got it!',
    'All set!',
    'Perfect!',
    'Sorted!',
    'On it!',
    'Taken care of!',
  ],
  taskComplete: [
    'Nice work!',
    'Nailed it!',
    'Great job!',
    'Excellent!',
    'Well done!',
    'Looking good!',
  ],
  confirmation: [
    'Absolutely!',
    'Of course!',
    'Sure thing!',
    'You got it!',
    'Happy to help!',
    'Right away!',
  ],
};

// Light, appropriate humor phrases
export const LIGHT_HUMOR = {
  waiting: [
    'Let me work my magic...',
    'Crunching the numbers...',
    'Consulting the data oracle...',
    'Digging through the archives...',
    'Connecting the dots...',
  ],
  noResults: [
    "Hmm, came up empty on that one. Let's try a different approach?",
    "Couldn't find what you're looking for. Maybe we can narrow it down?",
    'The search came back quiet. Shall we refine the criteria?',
  ],
  encouragement: [
    "You're making great progress!",
    'Nice to see you back!',
    'Always a pleasure to help!',
    "Let's get things done!",
  ],
};

// Welcome back messages for returning users
export const WELCOME_BACK_MESSAGES = [
  'Welcome back! Ready to pick up where we left off?',
  "Good to see you again! What can I help you with today?",
  "Welcome back! Let's continue making progress.",
  "Hey there! Ready to tackle some tasks?",
];

// First-time user messages
export const FIRST_TIME_MESSAGES = [
  "Hello! I'm your Atlas AI assistant. I can help you manage signals, organize folders, and keep track of important information. What would you like to do first?",
  "Welcome! I'm here to help you navigate Atlas AI. Whether it's creating signals, searching records, or managing folders - just ask!",
];

// Contextual celebration messages
export const CELEBRATION_MESSAGES = {
  signalCreated: [
    'Signal created successfully!',
    'New signal is now in the system!',
    'Signal has been recorded!',
  ],
  signalEdited: [
    'Signal updated!',
    'Changes saved successfully!',
    'Signal has been modified!',
  ],
  folderAssigned: [
    'Folder assignment complete!',
    'Owner has been assigned!',
    'Team member now owns this folder!',
  ],
  achievementUnlocked: [
    'Achievement unlocked!',
    'You earned a new badge!',
    'Milestone reached!',
  ],
  streakContinued: [
    'Streak continues!',
    "You're on a roll!",
    'Keep it up!',
  ],
};

// Helper function to get random item from array
export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Helper function to get appropriate acknowledgment
export function getAcknowledgment(type: keyof typeof ACKNOWLEDGMENTS): string {
  return getRandomItem(ACKNOWLEDGMENTS[type]);
}

// Helper function to get waiting message
export function getWaitingMessage(): string {
  return getRandomItem(LIGHT_HUMOR.waiting);
}

// Helper function to get celebration message
export function getCelebrationMessage(type: keyof typeof CELEBRATION_MESSAGES): string {
  return getRandomItem(CELEBRATION_MESSAGES[type]);
}
