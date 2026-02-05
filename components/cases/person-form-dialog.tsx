'use client';

import { useState, useEffect } from 'react';
import { Person } from '@/types/person';
import { usePeople } from '@/context/person-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PersonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onPersonCreated: (person: Person) => void;
  initialPerson?: Person;
}

export function PersonFormDialog({
  open,
  onClose,
  onPersonCreated,
  initialPerson,
}: PersonFormDialogProps) {
  const { createPerson } = usePeople();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Populate form when initialPerson is provided
  useEffect(() => {
    if (initialPerson) {
      setFirstName(initialPerson.firstName);
      setSurname(initialPerson.surname);
      setDateOfBirth(initialPerson.dateOfBirth);
      setAddress(initialPerson.address);
      setDescription(initialPerson.description || '');
      setEditMode(true);
    }
  }, [initialPerson]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !surname.trim()) return;

    setIsSubmitting(true);
    try {
      const newPerson = await createPerson({
        firstName: firstName.trim(),
        surname: surname.trim(),
        dateOfBirth: dateOfBirth || '',
        address: address.trim() || '',
        description: description.trim() || '-',
      });
      onPersonCreated(newPerson);
      handleClose();
    } catch (error) {
      console.error('Failed to create person:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFirstName('');
    setSurname('');
    setDateOfBirth('');
    setAddress('');
    setDescription('');
    setEditMode(false);
    onClose();
  };

  const isValid = firstName.trim().length > 0 && surname.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Persoon Bewerken' : 'Nieuwe Persoon Toevoegen'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Bekijk en bewerk de persoonsgegevens.'
              : 'Voeg een nieuwe persoon toe aan het globale register.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="person-firstName">Voornaam *</Label>
            <Input
              id="person-firstName"
              placeholder="Voer voornaam in"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Surname */}
          <div className="space-y-2">
            <Label htmlFor="person-surname">Achternaam *</Label>
            <Input
              id="person-surname"
              placeholder="Voer achternaam in"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="person-dob">Geboortedatum</Label>
            <Input
              id="person-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="person-address">Adres</Label>
            <Input
              id="person-address"
              placeholder="Voer adres in"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="person-description">Omschrijving</Label>
            <Textarea
              id="person-description"
              placeholder="Korte omschrijving van de persoon..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (editMode ? 'Opslaan...' : 'Toevoegen...') : (editMode ? 'Opslaan' : 'Persoon Toevoegen')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
