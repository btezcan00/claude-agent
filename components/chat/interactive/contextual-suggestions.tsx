'use client';

import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContextualSuggestion } from '@/types/chat';

// Define contextual suggestions based on completed action types
const SUGGESTION_MAP: Record<string, ContextualSuggestion[]> = {
  signal_created: [
    { label: 'Add a note', prompt: 'Add a note to the signal I just created' },
    { label: 'Create another', prompt: 'Create another signal' },
    { label: 'View all signals', prompt: 'Show me all signals' },
    { label: 'Assign to folder', prompt: 'Assign this signal to a folder' },
  ],
  signal_edited: [
    { label: 'Add a note', prompt: 'Add a note to the edited signal' },
    { label: 'View history', prompt: 'Show the activity history of this signal' },
    { label: 'Search similar', prompt: 'Search for similar signals' },
  ],
  signal_deleted: [
    { label: 'View remaining', prompt: 'Show remaining signals' },
    { label: 'Create new', prompt: 'Create a new signal' },
    { label: 'Signal stats', prompt: 'Show signal statistics' },
  ],
  note_added: [
    { label: 'Add another note', prompt: 'Add another note to this signal' },
    { label: 'View all notes', prompt: 'Show all notes for this signal' },
    { label: 'Edit the signal', prompt: 'Edit this signal' },
  ],
  folder_assigned: [
    { label: 'View folder', prompt: 'Show details of this folder' },
    { label: 'Edit folder', prompt: 'Edit folder details' },
    { label: 'Assign another', prompt: 'Assign another folder' },
  ],
  folder_listed: [
    { label: 'Create folder', prompt: 'Help me create a new folder' },
    { label: 'Folder stats', prompt: 'Show folder statistics' },
    { label: 'Assign owner', prompt: 'Assign an owner to a folder' },
  ],
  search_performed: [
    { label: 'Refine search', prompt: 'Refine my search with more filters' },
    { label: 'New search', prompt: 'Start a new search' },
    { label: 'View signal details', prompt: 'Tell me more about one of these signals' },
  ],
  stats_shown: [
    { label: 'View signals', prompt: 'Show me all signals' },
    { label: 'View folders', prompt: 'Show me all folders' },
    { label: 'Team overview', prompt: 'Show team members' },
  ],
  team_listed: [
    { label: 'Assign folder', prompt: 'Assign a folder to a team member' },
    { label: 'View folders', prompt: 'List all folders' },
    { label: 'Folder stats', prompt: 'Show folder statistics' },
  ],
  default: [
    { label: 'Create signal', prompt: 'Create a new signal' },
    { label: 'View folders', prompt: 'List all folders' },
    { label: 'Signal stats', prompt: 'Show signal statistics' },
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
      <p className="text-xs text-muted-foreground px-1">Suggested next steps:</p>
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
    assign_folder_owner: 'folder_assigned',
    edit_folder: 'folder_assigned',
    list_folders: 'folder_listed',
    search_signals: 'search_performed',
    get_signal_stats: 'stats_shown',
    get_folder_stats: 'stats_shown',
    list_team_members: 'team_listed',
    summarize_signals: 'stats_shown',
  };

  return actionMap[toolName];
}
