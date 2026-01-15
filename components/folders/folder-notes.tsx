'use client';

import { useState } from 'react';
import { Folder } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRelativeTime } from '@/lib/date-utils';
import { MessageSquare, Plus, Trash2, Shield } from 'lucide-react';

interface FolderNotesProps {
  folder: Folder;
  isAdmin?: boolean;
}

export function FolderNotes({ folder, isAdmin = true }: FolderNotesProps) {
  const { addFolderNote, removeFolderNote } = useFolders();
  const [noteContent, setNoteContent] = useState('');
  const [isAdminNote, setIsAdminNote] = useState(false);

  const notes = folder.notes || [];
  const regularNotes = notes.filter((n) => !n.isAdminNote);
  const adminNotes = notes.filter((n) => n.isAdminNote);

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addFolderNote(folder.id, noteContent.trim(), isAdminNote);
      setNoteContent('');
      setIsAdminNote(false);
    }
  };

  const NotesList = ({ notesList, showAdminBadge = false }: { notesList: typeof notes; showAdminBadge?: boolean }) => (
    <div className="space-y-3">
      {notesList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
      ) : (
        notesList.map((note) => (
          <div key={note.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px]">
                    {note.createdByName.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium">{note.createdByName}</span>
                  {showAdminBadge && note.isAdminNote && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(note.createdAt)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => removeFolderNote(folder.id, note.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <div className="space-y-2">
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write a note..."
            rows={3}
          />
          <div className="flex items-center justify-between">
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAdminNote}
                  onChange={(e) => setIsAdminNote(e.target.checked)}
                  className="rounded"
                />
                <Shield className="w-4 h-4 text-amber-600" />
                Admin note (only visible to admins)
              </label>
            )}
            <Button onClick={handleAddNote} disabled={!noteContent.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        <Separator />

        {/* Notes List */}
        {isAdmin ? (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({notes.length})</TabsTrigger>
              <TabsTrigger value="regular">Regular ({regularNotes.length})</TabsTrigger>
              <TabsTrigger value="admin">Admin ({adminNotes.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <NotesList notesList={notes} showAdminBadge />
            </TabsContent>
            <TabsContent value="regular" className="mt-4">
              <NotesList notesList={regularNotes} />
            </TabsContent>
            <TabsContent value="admin" className="mt-4">
              <NotesList notesList={adminNotes} />
            </TabsContent>
          </Tabs>
        ) : (
          <NotesList notesList={regularNotes} />
        )}
      </CardContent>
    </Card>
  );
}
