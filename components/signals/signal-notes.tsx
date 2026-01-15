'use client';

import { useState } from 'react';
import { Signal } from '@/types/signal';
import { useSignals } from '@/context/signal-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatRelativeTime } from '@/lib/date-utils';
import { MessageSquare, Send, Lock } from 'lucide-react';

interface SignalNotesProps {
  signal: Signal;
}

export function SignalNotes({ signal }: SignalNotesProps) {
  const { addNote } = useSignals();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    addNote(signal.id, newNote.trim());
    setNewNote('');
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes ({signal.notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a note to this signal..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newNote.trim() || isSubmitting}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </form>

        {/* Notes List */}
        {signal.notes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              {signal.notes.map((note, index) => (
                <div key={note.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {note.authorName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {note.authorName}
                        </span>
                        {note.isPrivate && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
