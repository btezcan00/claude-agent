'use client';

import { useState, useMemo } from 'react';
import { Case } from '@/types/case';
import { Person } from '@/types/person';
import { usePeople } from '@/context/person-context';
import { useCases } from '@/context/case-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Users } from 'lucide-react';
import { PersonFormDialog } from './person-form-dialog';
import { ConsultBrpDialog } from './consult-brp-dialog';

interface AddPersonDialogProps {
  caseItem: Case;
  open: boolean;
  onClose: () => void;
}

export function AddPersonDialog({
  caseItem,
  open,
  onClose,
}: AddPersonDialogProps) {
  const { people } = usePeople();
  const { addPersonToCase } = useCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [brpDialogOpen, setBrpDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handleRowClick = (person: Person) => {
    setSelectedPerson(person);
    setFormDialogOpen(true);
  };

  // Get existing person IDs in the case
  const existingPersonIds = useMemo(() => {
    return new Set((caseItem.peopleInvolved || []).map((p) => p.id));
  }, [caseItem.peopleInvolved]);

  // Filter people that are not already in the case
  const availablePeople = useMemo(() => {
    return people.filter((p) => !existingPersonIds.has(p.id));
  }, [people, existingPersonIds]);

  // Filter by search query
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return availablePeople;
    const query = searchQuery.toLowerCase();
    return availablePeople.filter(
      (p) =>
        p.firstName.toLowerCase().includes(query) ||
        p.surname.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.bsn && p.bsn.includes(query))
    );
  }, [availablePeople, searchQuery]);

  const handleAddPerson = (person: Person) => {
    addPersonToCase(caseItem.id, person);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleNewPersonCreated = (person: Person) => {
    // Add the newly created person to the case
    addPersonToCase(caseItem.id, person);
    setFormDialogOpen(false);
  };

  const handleBrpPersonSelected = (person: Person) => {
    // Add the person from BRP to the case
    addPersonToCase(caseItem.id, person);
    setBrpDialogOpen(false);
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
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-[80vw] max-w-none sm:max-w-none max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Persoon Toevoegen</DialogTitle>
            <DialogDescription>
              Zoek een bestaande persoon of voeg een nieuwe persoon toe aan: {caseItem.name}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, adres, omschrijving, telefoonnummers of rekeningnummers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Person Table */}
          <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-[300px]">
            {filteredPeople.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {availablePeople.length === 0
                    ? 'Alle personen zijn al toegevoegd aan dit dossier'
                    : 'Geen personen gevonden voor uw zoekopdracht'}
                </p>
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
                  {filteredPeople.map((person) => (
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
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddPerson(person);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer with Consult BRP and Add New buttons */}
          <div className="flex justify-between items-center border-t pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setBrpDialogOpen(true)}
              >
                BRP Raadplegen
              </Button>
              <Button
                onClick={() => {
                  setSelectedPerson(null);
                  setFormDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nieuwe persoon toevoegen
              </Button>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Person Form Dialog (New or Edit) */}
      <PersonFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedPerson(null);
        }}
        onPersonCreated={handleNewPersonCreated}
        initialPerson={selectedPerson || undefined}
      />

      {/* Consult BRP Dialog */}
      <ConsultBrpDialog
        open={brpDialogOpen}
        onClose={() => setBrpDialogOpen(false)}
        onPersonSelected={handleBrpPersonSelected}
      />
    </>
  );
}
