'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Plus, X } from 'lucide-react';

interface FolderActivitiesProps {
  folder: Folder;
}

export function FolderActivities({ folder }: FolderActivitiesProps) {
  const { addActivity, removeActivity } = useFolders();
  const [newActivity, setNewActivity] = useState('');

  const activities = folder.activities || [];

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      addActivity(folder.id, newActivity.trim());
      setNewActivity('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activities added</p>
          ) : (
            activities.map((activity) => (
              <Badge key={activity} variant="secondary" className="gap-1">
                {activity}
                <button
                  onClick={() => removeActivity(folder.id, activity)}
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
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Add activity"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
          />
          <Button size="sm" variant="outline" onClick={handleAddActivity}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
