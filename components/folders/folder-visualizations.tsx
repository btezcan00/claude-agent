'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Plus, X } from 'lucide-react';

interface FolderVisualizationsProps {
  folder: Folder;
}

export function FolderVisualizations({ folder }: FolderVisualizationsProps) {
  const { addVisualization, removeVisualization } = useFolders();
  const [newVisualization, setNewVisualization] = useState('');

  const visualizations = folder.visualizations || [];

  const handleAddVisualization = () => {
    if (newVisualization.trim()) {
      addVisualization(folder.id, newVisualization.trim());
      setNewVisualization('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Visualizations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {visualizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visualizations added</p>
          ) : (
            visualizations.map((visualization) => (
              <Badge key={visualization} variant="secondary" className="gap-1">
                {visualization}
                <button
                  onClick={() => removeVisualization(folder.id, visualization)}
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
            value={newVisualization}
            onChange={(e) => setNewVisualization(e.target.value)}
            placeholder="Add visualization"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddVisualization()}
          />
          <Button size="sm" variant="outline" onClick={handleAddVisualization}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
