'use client';

import { Case, CaseItem, SuggestionSource } from '@/types/case';
import { Person } from '@/types/person';
import { useCases } from '@/context/case-context';
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

interface CaseSuggestionsProps {
  caseItem: Case;
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
      return 'Personen';
    case 'reports':
      return 'Rapporten';
    case 'files':
      return 'Bestanden';
    default:
      return '';
  }
}

function formatSourceColumn(item: CaseItem): string {
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

export function CaseSuggestions({ caseItem }: CaseSuggestionsProps) {
  const { addPersonToCase, removeSuggestion } = useCases();

  const suggestions = caseItem.suggestions || [];

  const handleAddPerson = (item: CaseItem) => {
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
    addPersonToCase(caseItem.id, person);
    removeSuggestion(caseItem.id, item.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Suggesties
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen suggesties beschikbaar</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Suggesties</TableHead>
                <TableHead className="text-muted-foreground">Relatie</TableHead>
                <TableHead className="text-muted-foreground">Bron (Thema)</TableHead>
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
