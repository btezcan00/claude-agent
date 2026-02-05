'use client';

import { useState, useEffect, useMemo } from 'react';
import { Address, BUILDING_TYPES } from '@/types/address';
import { useAddresses } from '@/context/address-context';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';

// Mock postal code address data for lookup
const POSTAL_CODE_ADDRESSES: Record<string, { street: string; city: string; propertyType: string }[]> = {
  '1011': [
    { street: 'Kerkstraat 1', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Kerkstraat 15', city: 'Amsterdam', propertyType: 'Particulier' },
    { street: 'Kerkstraat 123', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Nieuwmarkt 4', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
  ],
  '1012': [
    { street: 'Damrak 1', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Damrak 45', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Rokin 92', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
  ],
  '1016': [
    { street: 'Prinsengracht 100', city: 'Amsterdam', propertyType: 'Particulier' },
    { street: 'Prinsengracht 456', city: 'Amsterdam', propertyType: 'Particulier' },
    { street: 'Herengracht 234', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
  ],
  '1054': [
    { street: 'Vondelstraat 89', city: 'Amsterdam', propertyType: 'Particulier' },
    { street: 'Overtoom 156', city: 'Amsterdam', propertyType: '-' },
    { street: 'Eerste Constantijn Huygensstraat 20', city: 'Amsterdam', propertyType: 'Particulier' },
  ],
  '1072': [
    { street: 'Ferdinand Bolstraat 34', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Albert Cuypstraat 67', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Van Woustraat 150', city: 'Amsterdam', propertyType: 'Particulier' },
  ],
  '1094': [
    { street: 'Javastraat 45', city: 'Amsterdam', propertyType: 'Particulier' },
    { street: 'Javastraat 100', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Molukkenstraat 12', city: 'Amsterdam', propertyType: 'Particulier' },
  ],
  '1013': [
    { street: 'Haarlemmerstraat 78', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Haarlemmerstraat 120', city: 'Amsterdam', propertyType: 'Bedrijfspand' },
    { street: 'Brouwersgracht 50', city: 'Amsterdam', propertyType: 'Particulier' },
  ],
};

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  onAddressCreated: (address: Address) => void;
  initialAddress?: Address;
}

export function AddressFormDialog({
  open,
  onClose,
  onAddressCreated,
  initialAddress,
}: AddressFormDialogProps) {
  const { createAddress } = useAddresses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [buildingType, setBuildingType] = useState<string>('-');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  // Postal code lookup state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);

  // Get address suggestions based on postal code
  const addressSuggestions = useMemo(() => {
    if (!postalCode || postalCode.length < 4) return [];
    const prefix = postalCode.substring(0, 4);
    return POSTAL_CODE_ADDRESSES[prefix] || [];
  }, [postalCode]);

  const handleConsultSources = () => {
    if (postalCode.length >= 4) {
      setIsConsulting(true);
      // Simulate API call delay
      setTimeout(() => {
        setShowSuggestions(true);
        setIsConsulting(false);
      }, 300);
    }
  };

  const handleSelectSuggestion = (suggestion: { street: string; city: string; propertyType: string }) => {
    setStreet(`${suggestion.street}, ${postalCode} ${suggestion.city}`);
    setBuildingType(suggestion.propertyType);
    setShowSuggestions(false);
  };

  // Populate form when initialAddress is provided
  useEffect(() => {
    if (initialAddress) {
      setStreet(initialAddress.street);
      setBuildingType(initialAddress.buildingType);
      setIsActive(initialAddress.isActive);
      setDescription(initialAddress.description || '');
      setEditMode(true);
    }
  }, [initialAddress]);

  const handleSubmit = async () => {
    if (!street.trim()) return;

    setIsSubmitting(true);
    try {
      const newAddress = await createAddress({
        street: street.trim(),
        buildingType: buildingType || '-',
        isActive,
        description: description.trim() || '-',
      });
      onAddressCreated(newAddress);
      handleClose();
    } catch (error) {
      console.error('Failed to create address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPostalCode('');
    setStreet('');
    setBuildingType('-');
    setIsActive(true);
    setDescription('');
    setEditMode(false);
    setShowSuggestions(false);
    onClose();
  };

  const isValid = street.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Adres Bewerken' : 'Nieuw Adres Toevoegen'}</DialogTitle>
          <DialogDescription>
            {editMode
              ? 'Bekijk en bewerk de adresgegevens.'
              : 'Voeg een nieuw adres toe aan het globale register.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Postal Code with Lookup */}
          {!editMode && (
            <div className="space-y-2">
              <Label htmlFor="address-postal">Postcode</Label>
              <div className="flex gap-2">
                <Input
                  id="address-postal"
                  placeholder="bijv. 1011 AB"
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    setShowSuggestions(false);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConsultSources}
                  disabled={postalCode.length < 4 || isConsulting}
                >
                  <Search className="w-4 h-4 mr-1" />
                  {isConsulting ? 'Zoeken...' : 'Bronnen raadplegen'}
                </Button>
              </div>

              {/* Address Suggestions */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="border rounded-md bg-background shadow-sm">
                  <div className="p-2 text-sm text-muted-foreground border-b">
                    Selecteer een adres:
                  </div>
                  <div className="max-h-[150px] overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors flex justify-between items-center"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <span>{suggestion.street}, {postalCode.substring(0, 4)} {suggestion.city}</span>
                        <span className="text-muted-foreground text-xs ml-2">{suggestion.propertyType}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSuggestions && addressSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Geen adressen gevonden voor deze postcode. Voer het adres hieronder handmatig in.
                </p>
              )}
            </div>
          )}

          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="address-street">Adres *</Label>
            <Input
              id="address-street"
              placeholder="Straatnaam, huisnummer, postcode, stad"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          {/* Building Type */}
          <div className="space-y-2">
            <Label htmlFor="address-type">Pandtype</Label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger id="address-type">
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                {BUILDING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="address-active">Actueel</Label>
            <Switch
              id="address-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="address-description">Omschrijving</Label>
            <Textarea
              id="address-description"
              placeholder="Korte omschrijving van het adres..."
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
            {isSubmitting ? (editMode ? 'Opslaan...' : 'Toevoegen...') : (editMode ? 'Opslaan' : 'Adres Toevoegen')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
