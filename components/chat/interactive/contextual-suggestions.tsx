'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContextualSuggestion } from '@/types/chat';

// Define contextual suggestions based on completed action types
const SUGGESTION_MAP: Record<string, ContextualSuggestion[]> = {
  signal_created: [
    { label: 'Notitie toevoegen', prompt: 'Voeg een notitie toe aan de melding die ik net heb aangemaakt' },
    { label: 'Nog een aanmaken', prompt: 'Maak nog een melding aan' },
    { label: 'Alle meldingen bekijken', prompt: 'Toon alle meldingen' },
    { label: 'Aan dossier toewijzen', prompt: 'Wijs deze melding toe aan een dossier' },
  ],
  signal_edited: [
    { label: 'Notitie toevoegen', prompt: 'Voeg een notitie toe aan de bewerkte melding' },
    { label: 'Geschiedenis bekijken', prompt: 'Toon de activiteitengeschiedenis van deze melding' },
    { label: 'Vergelijkbare zoeken', prompt: 'Zoek naar vergelijkbare meldingen' },
  ],
  signal_deleted: [
    { label: 'Overige bekijken', prompt: 'Toon overige meldingen' },
    { label: 'Nieuwe aanmaken', prompt: 'Maak een nieuwe melding aan' },
    { label: 'Melding statistieken', prompt: 'Toon meldingstatistieken' },
  ],
  note_added: [
    { label: 'Nog een notitie', prompt: 'Voeg nog een notitie toe aan deze melding' },
    { label: 'Alle notities bekijken', prompt: 'Toon alle notities voor deze melding' },
    { label: 'Melding bewerken', prompt: 'Bewerk deze melding' },
  ],
  case_assigned: [
    { label: 'Dossier bekijken', prompt: 'Toon details van dit dossier' },
    { label: 'Dossier bewerken', prompt: 'Bewerk dossierdetails' },
    { label: 'Andere toewijzen', prompt: 'Wijs een ander dossier toe' },
  ],
  case_listed: [
    { label: 'Dossier aanmaken', prompt: 'Help me een nieuw dossier aan te maken' },
    { label: 'Dossier statistieken', prompt: 'Toon dossierstatistieken' },
    { label: 'Eigenaar toewijzen', prompt: 'Wijs een eigenaar toe aan een dossier' },
  ],
  search_performed: [
    { label: 'Zoekopdracht verfijnen', prompt: 'Verfijn mijn zoekopdracht met meer filters' },
    { label: 'Nieuwe zoekopdracht', prompt: 'Start een nieuwe zoekopdracht' },
    { label: 'Meldingdetails bekijken', prompt: 'Vertel me meer over een van deze meldingen' },
  ],
  stats_shown: [
    { label: 'Meldingen bekijken', prompt: 'Toon alle meldingen' },
    { label: 'Dossiers bekijken', prompt: 'Toon alle dossiers' },
    { label: 'Team overzicht', prompt: 'Toon teamleden' },
  ],
  team_listed: [
    { label: 'Dossier toewijzen', prompt: 'Wijs een dossier toe aan een teamlid' },
    { label: 'Dossiers bekijken', prompt: 'Toon alle dossiers' },
    { label: 'Dossier statistieken', prompt: 'Toon dossierstatistieken' },
  ],
  default: [
    { label: 'Melding aanmaken', prompt: 'Maak een nieuwe melding aan' },
    { label: 'Dossiers bekijken', prompt: 'Toon alle dossiers' },
    { label: 'Melding statistieken', prompt: 'Toon meldingstatistieken' },
  ],
};

interface ContextualSuggestionsProps {
  lastActionType?: string;
  onSuggestionSelect: (prompt: string) => void;
  className?: string;
  disabled?: boolean;
  maxSuggestions?: number;
}

export function ContextualSuggestions({
  lastActionType,
  onSuggestionSelect,
  className,
  disabled = false,
  maxSuggestions = 3,
}: ContextualSuggestionsProps) {
  const suggestions = useMemo(() => {
    const suggestionList =
      SUGGESTION_MAP[lastActionType || ''] || SUGGESTION_MAP.default;
    return suggestionList.slice(0, maxSuggestions);
  }, [lastActionType, maxSuggestions]);

  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-xs text-muted-foreground px-1">Voorgestelde volgende stappen:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.prompt}
            onClick={() => onSuggestionSelect(suggestion.prompt)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all',
              'bg-primary/10 hover:bg-primary/20 text-primary',
              'border border-primary/20 hover:border-primary/30',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'disabled:opacity-50 disabled:pointer-events-none',
              'animate-in fade-in-50 slide-in-from-left-2 duration-200'
            )}
            style={{
              animationDelay: `${index * 75}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <span>{suggestion.label}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper function to detect action type from tool response
export function detectActionType(toolName?: string): string | undefined {
  if (!toolName) return undefined;

  const actionMap: Record<string, string> = {
    create_signal: 'signal_created',
    edit_signal: 'signal_edited',
    delete_signal: 'signal_deleted',
    add_note: 'note_added',
    assign_case_owner: 'case_assigned',
    edit_case: 'case_assigned',
    list_cases: 'case_listed',
    search_signals: 'search_performed',
    get_signal_stats: 'stats_shown',
    get_case_stats: 'stats_shown',
    list_team_members: 'team_listed',
    summarize_signals: 'stats_shown',
  };

  return actionMap[toolName];
}
