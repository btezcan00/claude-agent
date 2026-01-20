'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X } from 'lucide-react';

interface FolderFindingsProps {
  folder: Folder;
}

export function FolderFindings({ folder }: FolderFindingsProps) {
  const { addFinding, removeFinding } = useFolders();
  const [newFinding, setNewFinding] = useState('');

  const findings = folder.findings || [];

  const handleAddFinding = () => {
    if (newFinding.trim()) {
      addFinding(folder.id, newFinding.trim());
      setNewFinding('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4" />
          Findings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings added</p>
          ) : (
            findings.map((finding) => (
              <Badge key={finding} variant="secondary" className="gap-1">
                {finding}
                <button
                  onClick={() => removeFinding(folder.id, finding)}
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
            value={newFinding}
            onChange={(e) => setNewFinding(e.target.value)}
            placeholder="Add finding"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddFinding()}
          />
          <Button size="sm" variant="outline" onClick={handleAddFinding}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
