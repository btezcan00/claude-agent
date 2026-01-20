'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, X } from 'lucide-react';

interface FolderRecordsProps {
  folder: Folder;
}

export function FolderRecords({ folder }: FolderRecordsProps) {
  const { addRecord, removeRecord } = useFolders();
  const [newRecord, setNewRecord] = useState('');

  const records = folder.records || [];

  const handleAddRecord = () => {
    if (newRecord.trim()) {
      addRecord(folder.id, newRecord.trim());
      setNewRecord('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records added</p>
          ) : (
            records.map((record) => (
              <Badge key={record} variant="secondary" className="gap-1">
                {record}
                <button
                  onClick={() => removeRecord(folder.id, record)}
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
            value={newRecord}
            onChange={(e) => setNewRecord(e.target.value)}
            placeholder="Add record"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddRecord()}
          />
          <Button size="sm" variant="outline" onClick={handleAddRecord}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
