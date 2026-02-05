'use client';

import { useState } from 'react';
import { Case } from '@/types/case';
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
import { Users, Plus, X } from 'lucide-react';
import { AddPersonDialog } from './add-person-dialog';
import { PersonFormDialog } from './person-form-dialog';

interface CasePeopleInvolvedProps {
  caseItem: Case;
}

export function CasePeopleInvolved({ caseItem }: CasePeopleInvolvedProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const { removePersonInvolved } = useCases();

  const people = caseItem.peopleInvolved || [];

  const handleRowClick = (person: Person) => {
    setSelectedPerson(person);
    setEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Betrokken Personen</CardTitle>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Toevoegen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Geen personen gekoppeld aan dit dossier.</p>
            <p className="text-sm mt-1">Klik op &quot;Toevoegen&quot; om personen te koppelen.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voornaam</TableHead>
                <TableHead>Achternaam</TableHead>
                <TableHead>Geboortedatum</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow
                  key={person.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(person)}
                >
                  <TableCell className="font-medium">{person.firstName}</TableCell>
                  <TableCell>{person.surname}</TableCell>
                  <TableCell>{formatDate(person.dateOfBirth)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {person.address || '-'}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {person.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePersonInvolved(caseItem.id, person.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddPersonDialog
        caseItem={caseItem}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {selectedPerson && (
        <PersonFormDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedPerson(null);
          }}
          onPersonCreated={() => {
            setEditDialogOpen(false);
            setSelectedPerson(null);
          }}
          initialPerson={selectedPerson}
        />
      )}
    </Card>
  );
}
