/**
 * Time-aware greeting selection
 * Returns appropriate greetings based on time of day
 */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface GreetingVariant {
  greeting: string;
  followUp: string;
}

// Greetings organized by time of day
const GREETINGS: Record<TimeOfDay, GreetingVariant[]> = {
  morning: [
    {
      greeting: 'Good morning!',
      followUp: 'Ready to start fresh today?',
    },
    {
      greeting: 'Morning!',
      followUp: 'What can I help you tackle today?',
    },
    {
      greeting: 'Good morning!',
      followUp: "Let's make today productive!",
    },
    {
      greeting: 'Rise and shine!',
      followUp: "What's on the agenda?",
    },
  ],
  afternoon: [
    {
      greeting: 'Good afternoon!',
      followUp: 'How can I assist you?',
    },
    {
      greeting: 'Hey there!',
      followUp: "What can I help you with this afternoon?",
    },
    {
      greeting: 'Good afternoon!',
      followUp: "Let's keep the momentum going!",
    },
    {
      greeting: 'Hello!',
      followUp: 'Ready to get some things done?',
    },
  ],
  evening: [
    {
      greeting: 'Good evening!',
      followUp: 'Wrapping up for the day?',
    },
    {
      greeting: 'Evening!',
      followUp: 'How can I help you finish strong?',
    },
    {
      greeting: 'Good evening!',
      followUp: "Let's tackle those last tasks.",
    },
    {
      greeting: 'Hello!',
      followUp: "What can I help you with this evening?",
    },
  ],
  night: [
    {
      greeting: 'Working late?',
      followUp: 'I\'m here to help you wrap things up.',
    },
    {
      greeting: 'Hello, night owl!',
      followUp: 'What brings you here at this hour?',
    },
    {
      greeting: 'Late night session?',
      followUp: "Let's make it count!",
    },
  ],
};

// Get the time of day based on current hour
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
}

// Get a random greeting for the current time of day
export function getTimeAwareGreeting(): GreetingVariant {
  const timeOfDay = getTimeOfDay();
  const greetings = GREETINGS[timeOfDay];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// Get the initial greeting message for the chat
export function getInitialGreeting(
  isReturningUser: boolean = false,
  userName?: string
): string {
  const { greeting, followUp } = getTimeAwareGreeting();
  const namePrefix = userName ? `${userName}, ` : '';

  if (isReturningUser) {
    return `${greeting} ${namePrefix}Welcome back! ${followUp} I can help you manage signals, organize cases, assign team members, and more.`;
  }

  return `${greeting} ${namePrefix}I'm your Atlas AI assistant. ${followUp} I can help you create and manage signals, organize cases, assign team members, search records, and much more. How can I help you today?`;
}

// Check if current time qualifies for "early bird" achievement (before 9 AM)
export function isEarlyBird(): boolean {
  const hour = new Date().getHours();
  return hour < 9;
}

// Check if current time qualifies for "night owl" achievement (after 9 PM)
export function isNightOwl(): boolean {
  const hour = new Date().getHours();
  return hour >= 21;
}

// Get encouraging message based on streak
export function getStreakMessage(streakDays: number): string {
  if (streakDays === 0) {
    return '';
  } else if (streakDays === 1) {
    return "Great start! Let's build that streak!";
  } else if (streakDays < 7) {
    return `${streakDays}-day streak! Keep it going!`;
  } else if (streakDays < 30) {
    return `Amazing ${streakDays}-day streak!`;
  } else {
    return `Incredible ${streakDays}-day streak! You're a champion!`;
  }
}
