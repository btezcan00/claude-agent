'use client';

import { useState, useEffect } from 'react';
import { Signal, SignalType, SignalSource, ContactPerson, UpdateSignalInput } from '@/types/signal';
import { useSignals } from '@/context/signal-context';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SIGNAL_TYPES,
  SIGNAL_SOURCES,
  SIGNAL_TYPE_CONFIG,
  SIGNAL_SOURCE_CONFIG,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface SignalEditDialogProps {
  signal: Signal;
  open: boolean;
  onClose: () => void;
}

function formatDateTimeForInput(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SignalEditDialog({ signal, open, onClose }: SignalEditDialogProps) {
  const { updateSignal } = useSignals();

  // Form state
  const [selectedTypes, setSelectedTypes] = useState<SignalType[]>(signal.types);
  const [description, setDescription] = useState(signal.description);
  const [placeOfObservation, setPlaceOfObservation] = useState(signal.placeOfObservation);
  const [locationDescription, setLocationDescription] = useState(signal.locationDescription || '');
  const [timeOfObservation, setTimeOfObservation] = useState(formatDateTimeForInput(signal.timeOfObservation));
  const [receivedBy, setReceivedBy] = useState<SignalSource>(signal.receivedBy);

  // Contact person state
  const [hasContactPerson, setHasContactPerson] = useState(!!signal.contactPerson);
  const [contactFirstName, setContactFirstName] = useState(signal.contactPerson?.firstName || '');
  const [contactLastName, setContactLastName] = useState(signal.contactPerson?.lastName || '');
  const [contactEmail, setContactEmail] = useState(signal.contactPerson?.email || '');
  const [contactPhone, setContactPhone] = useState(signal.contactPerson?.phoneNumber || '');
  const [contactWantsFeedback, setContactWantsFeedback] = useState(signal.contactPerson?.wantsFeedback || false);

  useEffect(() => {
    setSelectedTypes(signal.types);
    setDescription(signal.description);
    setPlaceOfObservation(signal.placeOfObservation);
    setLocationDescription(signal.locationDescription || '');
    setTimeOfObservation(formatDateTimeForInput(signal.timeOfObservation));
    setReceivedBy(signal.receivedBy);
    setHasContactPerson(!!signal.contactPerson);
    setContactFirstName(signal.contactPerson?.firstName || '');
    setContactLastName(signal.contactPerson?.lastName || '');
    setContactEmail(signal.contactPerson?.email || '');
    setContactPhone(signal.contactPerson?.phoneNumber || '');
    setContactWantsFeedback(signal.contactPerson?.wantsFeedback || false);
  }, [signal]);

  const handleTypeToggle = (type: SignalType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTypes.length === 0 || !description.trim() || !placeOfObservation.trim() || !timeOfObservation) {
      return;
    }

    if (hasContactPerson && (!contactFirstName.trim() || !contactLastName.trim())) {
      return;
    }

    let contactPerson: ContactPerson | undefined;
    if (hasContactPerson) {
      contactPerson = {
        firstName: contactFirstName.trim(),
        lastName: contactLastName.trim(),
        email: contactEmail.trim() || undefined,
        phoneNumber: contactPhone.trim() || undefined,
        wantsFeedback: contactWantsFeedback,
      };
    }

    const updateData: UpdateSignalInput = {
      types: selectedTypes,
      description: description.trim(),
      placeOfObservation: placeOfObservation.trim(),
      locationDescription: locationDescription.trim() || undefined,
      timeOfObservation: new Date(timeOfObservation).toISOString(),
      receivedBy,
      contactPerson,
    };

    updateSignal(signal.id, updateData);
    onClose();
  };

  const isFormValid =
    selectedTypes.length > 0 &&
    description.trim() &&
    placeOfObservation.trim() &&
    timeOfObservation &&
    (!hasContactPerson || (contactFirstName.trim() && contactLastName.trim()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Signal</DialogTitle>
          <DialogDescription>
            Update the signal details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Signal Types - Multi-select */}
            <div className="grid gap-2">
              <Label>Signal Type(s) *</Label>
              <div className="flex flex-wrap gap-2">
                {SIGNAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeToggle(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                      selectedTypes.includes(type)
                        ? SIGNAL_TYPE_CONFIG[type].className + ' border-current'
                        : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                    )}
                  >
                    {SIGNAL_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Place of Observation */}
            <div className="grid gap-2">
              <Label htmlFor="placeOfObservation">Place of Observation (Address) *</Label>
              <Input
                id="placeOfObservation"
                value={placeOfObservation}
                onChange={(e) => setPlaceOfObservation(e.target.value)}
                required
              />
            </div>

            {/* Location Description */}
            <div className="grid gap-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Textarea
                id="locationDescription"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Time of Observation */}
            <div className="grid gap-2">
              <Label htmlFor="timeOfObservation">Time of Observation *</Label>
              <Input
                id="timeOfObservation"
                type="datetime-local"
                value={timeOfObservation}
                onChange={(e) => setTimeOfObservation(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Received By */}
            <div className="grid gap-2">
              <Label htmlFor="receivedBy">Signal Received By *</Label>
              <Select
                value={receivedBy}
                onValueChange={(value: SignalSource) => setReceivedBy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {SIGNAL_SOURCE_CONFIG[source].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-contact" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Contact Person
                </Label>
                <Switch
                  id="has-contact"
                  checked={hasContactPerson}
                  onCheckedChange={setHasContactPerson}
                />
              </div>

              {hasContactPerson && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactFirstName">First Name *</Label>
                      <Input
                        id="contactFirstName"
                        value={contactFirstName}
                        onChange={(e) => setContactFirstName(e.target.value)}
                        required={hasContactPerson}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactLastName">Last Name *</Label>
                      <Input
                        id="contactLastName"
                        value={contactLastName}
                        onChange={(e) => setContactLastName(e.target.value)}
                        required={hasContactPerson}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wantsFeedback"
                      checked={contactWantsFeedback}
                      onCheckedChange={(checked) => setContactWantsFeedback(checked === true)}
                    />
                    <Label htmlFor="wantsFeedback" className="text-sm cursor-pointer">
                      Contact person wants to receive feedback via email
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
