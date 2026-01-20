'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, X } from 'lucide-react';

interface FolderPeopleInvolvedProps {
  folder: Folder;
}

export function FolderPeopleInvolved({ folder }: FolderPeopleInvolvedProps) {
  const { addPersonInvolved, removePersonInvolved } = useFolders();
  const [newPerson, setNewPerson] = useState('');

  const peopleInvolved = folder.peopleInvolved || [];

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      addPersonInvolved(folder.id, newPerson.trim());
      setNewPerson('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          People Involved
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {peopleInvolved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No people added</p>
          ) : (
            peopleInvolved.map((person) => (
              <Badge key={person} variant="secondary" className="gap-1">
                {person}
                <button
                  onClick={() => removePersonInvolved(folder.id, person)}
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
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            placeholder="Add person"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
          />
          <Button size="sm" variant="outline" onClick={handleAddPerson}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
