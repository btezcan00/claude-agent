'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Plus, X } from 'lucide-react';

interface FolderLettersProps {
  folder: Folder;
}

export function FolderLetters({ folder }: FolderLettersProps) {
  const { addLetter, removeLetter } = useFolders();
  const [newLetter, setNewLetter] = useState('');

  const letters = folder.letters || [];

  const handleAddLetter = () => {
    if (newLetter.trim()) {
      addLetter(folder.id, newLetter.trim());
      setNewLetter('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Letters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {letters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No letters added</p>
          ) : (
            letters.map((letter) => (
              <Badge key={letter} variant="secondary" className="gap-1">
                {letter}
                <button
                  onClick={() => removeLetter(folder.id, letter)}
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
            value={newLetter}
            onChange={(e) => setNewLetter(e.target.value)}
            placeholder="Add letter"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddLetter()}
          />
          <Button size="sm" variant="outline" onClick={handleAddLetter}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
