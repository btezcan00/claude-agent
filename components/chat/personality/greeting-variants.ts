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
      greeting: 'Goedemorgen!',
      followUp: 'Klaar om fris te beginnen vandaag?',
    },
    {
      greeting: 'Morgen!',
      followUp: 'Waarmee kan ik je helpen vandaag?',
    },
    {
      greeting: 'Goedemorgen!',
      followUp: 'Laten we er een productieve dag van maken!',
    },
    {
      greeting: 'Goedemorgen!',
      followUp: 'Wat staat er op de agenda?',
    },
  ],
  afternoon: [
    {
      greeting: 'Goedemiddag!',
      followUp: 'Hoe kan ik je helpen?',
    },
    {
      greeting: 'Hallo!',
      followUp: 'Waarmee kan ik je vanmiddag helpen?',
    },
    {
      greeting: 'Goedemiddag!',
      followUp: 'Laten we het momentum vasthouden!',
    },
    {
      greeting: 'Hallo!',
      followUp: 'Klaar om wat dingen gedaan te krijgen?',
    },
  ],
  evening: [
    {
      greeting: 'Goedenavond!',
      followUp: 'Bezig met afronden voor vandaag?',
    },
    {
      greeting: 'Avond!',
      followUp: 'Hoe kan ik je helpen om sterk af te sluiten?',
    },
    {
      greeting: 'Goedenavond!',
      followUp: 'Laten we die laatste taken aanpakken.',
    },
    {
      greeting: 'Hallo!',
      followUp: 'Waarmee kan ik je vanavond helpen?',
    },
  ],
  night: [
    {
      greeting: 'Laat aan het werk?',
      followUp: 'Ik ben hier om je te helpen met afronden.',
    },
    {
      greeting: 'Hallo, nachtuil!',
      followUp: 'Wat brengt je hier op dit uur?',
    },
    {
      greeting: 'Late sessie?',
      followUp: 'Laten we er het beste van maken!',
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
    return `${greeting} ${namePrefix}Welkom terug! ${followUp} Ik kan je helpen met het beheren van meldingen, organiseren van dossiers, toewijzen van teamleden en meer.`;
  }

  return `${greeting} ${namePrefix}Ik ben je Atlas AI-assistent. ${followUp} Ik kan je helpen met het aanmaken en beheren van meldingen, organiseren van dossiers, toewijzen van teamleden, zoeken in gegevens en nog veel meer. Waarmee kan ik je vandaag helpen?`;
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
    return 'Goede start! Laten we die reeks opbouwen!';
  } else if (streakDays < 7) {
    return `${streakDays}-daagse reeks! Ga zo door!`;
  } else if (streakDays < 30) {
    return `Geweldige ${streakDays}-daagse reeks!`;
  } else {
    return `Ongelooflijke ${streakDays}-daagse reeks! Je bent een kampioen!`;
  }
}
