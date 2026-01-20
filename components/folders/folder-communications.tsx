'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, X } from 'lucide-react';

interface FolderCommunicationsProps {
  folder: Folder;
}

export function FolderCommunications({ folder }: FolderCommunicationsProps) {
  const { addCommunication, removeCommunication } = useFolders();
  const [newCommunication, setNewCommunication] = useState('');

  const communications = folder.communications || [];

  const handleAddCommunication = () => {
    if (newCommunication.trim()) {
      addCommunication(folder.id, newCommunication.trim());
      setNewCommunication('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {communications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No communications added</p>
          ) : (
            communications.map((communication) => (
              <Badge key={communication} variant="secondary" className="gap-1">
                {communication}
                <button
                  onClick={() => removeCommunication(folder.id, communication)}
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
            value={newCommunication}
            onChange={(e) => setNewCommunication(e.target.value)}
            placeholder="Add communication"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCommunication()}
          />
          <Button size="sm" variant="outline" onClick={handleAddCommunication}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
