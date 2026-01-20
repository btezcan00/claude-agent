'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lightbulb, Plus, X } from 'lucide-react';

interface FolderSuggestionsProps {
  folder: Folder;
}

export function FolderSuggestions({ folder }: FolderSuggestionsProps) {
  const { addSuggestion, removeSuggestion } = useFolders();
  const [newSuggestion, setNewSuggestion] = useState('');

  const suggestions = folder.suggestions || [];

  const handleAddSuggestion = () => {
    if (newSuggestion.trim()) {
      addSuggestion(folder.id, newSuggestion.trim());
      setNewSuggestion('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions added</p>
          ) : (
            suggestions.map((suggestion) => (
              <Badge key={suggestion} variant="secondary" className="gap-1">
                {suggestion}
                <button
                  onClick={() => removeSuggestion(folder.id, suggestion)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            placeholder="Add suggestion"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSuggestion()}
          />
          <Button size="sm" variant="outline" onClick={handleAddSuggestion}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
