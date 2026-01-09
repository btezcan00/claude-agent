'use client';

import { useState } from 'react';
import { Case } from '@/types/case';
import { useCases } from '@/context/case-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatRelativeTime } from '@/lib/date-utils';
import { MessageSquare, Send, Lock } from 'lucide-react';

interface CaseNotesProps {
  caseItem: Case;
}

export function CaseNotes({ caseItem }: CaseNotesProps) {
  const { addNote } = useCases();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    addNote(caseItem.id, newNote.trim());
    setNewNote('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Add a note to this case..."
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
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Notes ({caseItem.notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caseItem.notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Add a note to track progress on this case</p>
            </div>
          ) : (
            <div className="space-y-4">
              {caseItem.notes.map((note, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
