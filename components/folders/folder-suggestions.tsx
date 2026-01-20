'use client';

import { Folder, FolderItem, SuggestionSource } from '@/types/folder';
import { Person } from '@/types/person';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare, User, FileText, File, Lightbulb, Plus } from 'lucide-react';
import { generateId } from '@/lib/utils';

interface FolderSuggestionsProps {
  folder: Folder;
}

function getSourceIcon(source?: SuggestionSource) {
  switch (source) {
    case 'persons':
      return User;
    case 'reports':
      return FileText;
    case 'files':
      return File;
    default:
      return Lightbulb;
  }
}

function getSourceLabel(source?: SuggestionSource) {
  switch (source) {
    case 'persons':
      return 'Persons';
    case 'reports':
      return 'Reports';
    case 'files':
      return 'Files';
    default:
      return '';
  }
}

function formatSourceColumn(item: FolderItem): string {
  const sourceLabel = getSourceLabel(item.source);
  if (!sourceLabel) return '';
  if (item.sourceTheme) {
    return `${sourceLabel} (${item.sourceTheme})`;
  }
  return sourceLabel;
}

function parsePersonName(fullName: string): { firstName: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], surname: '' };
  }
  const firstName = parts[0];
  const surname = parts.slice(1).join(' ');
  return { firstName, surname };
}

export function FolderSuggestions({ folder }: FolderSuggestionsProps) {
  const { addPersonToFolder, removeSuggestion } = useFolders();

  const suggestions = folder.suggestions || [];

  const handleAddPerson = (item: FolderItem) => {
    const { firstName, surname } = parsePersonName(item.label);
    const person: Person = {
      id: generateId(),
      firstName,
      surname,
      dateOfBirth: '',
      address: item.description,
      description: '',
      createdAt: new Date().toISOString(),
    };
    addPersonToFolder(folder.id, person);
    removeSuggestion(folder.id, item.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Suggestions</TableHead>
                <TableHead className="text-muted-foreground">Relation</TableHead>
                <TableHead className="text-muted-foreground">Source (Theme)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((item) => {
                const Icon = getSourceIcon(item.source);
                const isPersonSuggestion = item.source === 'persons';
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSourceColumn(item)}
                    </TableCell>
                    <TableCell>
                      {isPersonSuggestion && (
                        <Button
                          size="icon"
                          className="h-7 w-7 rounded-full bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white"
                          onClick={() => handleAddPerson(item)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
