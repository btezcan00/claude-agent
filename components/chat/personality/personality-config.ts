/**
 * Personality Configuration
 * Defines character traits and response modifiers for the chat assistant
 */

// Varied acknowledgments for successful actions
export const ACKNOWLEDGMENTS = {
  success: [
    'Klaar!',
    'Begrepen!',
    'Geregeld!',
    'Perfect!',
    'Gedaan!',
    'Bezig!',
    'Afgehandeld!',
  ],
  taskComplete: [
    'Mooi werk!',
    'Gelukt!',
    'Goed gedaan!',
    'Uitstekend!',
    'Prima!',
    'Ziet er goed uit!',
  ],
  confirmation: [
    'Absoluut!',
    'Natuurlijk!',
    'Zeker!',
    'Komt voor elkaar!',
    'Graag gedaan!',
    'Direct!',
  ],
};

// Light, appropriate humor phrases
export const LIGHT_HUMOR = {
  waiting: [
    'Even mijn magie toepassen...',
    'De cijfers verwerken...',
    'Het data-orakel raadplegen...',
    'Door de archieven graven...',
    'De puzzelstukjes samenvoegen...',
  ],
  noResults: [
    'Hmm, niets gevonden. Zullen we een andere aanpak proberen?',
    'Kon niet vinden wat je zoekt. Kunnen we het verfijnen?',
    'De zoekopdracht leverde niets op. Zullen we de criteria aanpassen?',
  ],
  encouragement: [
    'Je maakt goede voortgang!',
    'Fijn om je weer te zien!',
    'Altijd een plezier om te helpen!',
    'Laten we aan de slag gaan!',
  ],
};

// Welcome back messages for returning users
export const WELCOME_BACK_MESSAGES = [
  'Welkom terug! Klaar om verder te gaan waar we gebleven waren?',
  'Fijn om je weer te zien! Waarmee kan ik je vandaag helpen?',
  'Welkom terug! Laten we verder gaan met de voortgang.',
  'Hallo! Klaar om wat taken aan te pakken?',
];

// First-time user messages
export const FIRST_TIME_MESSAGES = [
  'Hallo! Ik ben je Atlas AI-assistent. Ik kan je helpen met het beheren van meldingen, organiseren van dossiers en bijhouden van belangrijke informatie. Wat wil je eerst doen?',
  'Welkom! Ik ben hier om je te helpen bij het navigeren door Atlas AI. Of het nu gaat om meldingen aanmaken, gegevens zoeken of dossiers beheren - vraag maar!',
];

// Contextual celebration messages
export const CELEBRATION_MESSAGES = {
  signalCreated: [
    'Melding succesvol aangemaakt!',
    'Nieuwe melding staat nu in het systeem!',
    'Melding is vastgelegd!',
  ],
  signalEdited: [
    'Melding bijgewerkt!',
    'Wijzigingen succesvol opgeslagen!',
    'Melding is aangepast!',
  ],
  caseAssigned: [
    'Dossiertoewijzing voltooid!',
    'Eigenaar is toegewezen!',
    'Teamlid is nu eigenaar van dit dossier!',
  ],
  achievementUnlocked: [
    'Prestatie ontgrendeld!',
    'Je hebt een nieuwe badge verdiend!',
    'Mijlpaal bereikt!',
  ],
  streakContinued: [
    'Reeks gaat door!',
    'Je bent lekker bezig!',
    'Ga zo door!',
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
