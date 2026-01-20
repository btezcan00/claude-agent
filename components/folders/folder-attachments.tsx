'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Plus, X } from 'lucide-react';

interface FolderAttachmentsProps {
  folder: Folder;
}

export function FolderAttachments({ folder }: FolderAttachmentsProps) {
  const { addAttachment, removeAttachment } = useFolders();
  const [newAttachment, setNewAttachment] = useState('');

  const attachments = folder.attachments || [];

  const handleAddAttachment = () => {
    if (newAttachment.trim()) {
      addAttachment(folder.id, newAttachment.trim());
      setNewAttachment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments added</p>
          ) : (
            attachments.map((attachment) => (
              <Badge key={attachment} variant="secondary" className="gap-1">
                {attachment}
                <button
                  onClick={() => removeAttachment(folder.id, attachment)}
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
            value={newAttachment}
            onChange={(e) => setNewAttachment(e.target.value)}
            placeholder="Add attachment"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAttachment()}
          />
          <Button size="sm" variant="outline" onClick={handleAddAttachment}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
