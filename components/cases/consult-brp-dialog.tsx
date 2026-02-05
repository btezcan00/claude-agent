'use client';

import { useState } from 'react';
import { Person, MUNICIPALITIES } from '@/types/person';
import { usePeople } from '@/context/person-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Info, ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConsultBrpDialogProps {
  open: boolean;
  onClose: () => void;
  onPersonSelected: (person: Person) => void;
}

export function ConsultBrpDialog({
  open,
  onClose,
  onPersonSelected,
}: ConsultBrpDialogProps) {
  const { searchBrp } = usePeople();

  // Form state
  const [bsn, setBsn] = useState('');
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [municipality, setMunicipality] = useState('');

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchBrp({
        bsn: bsn || undefined,
        surname: surname || undefined,
        firstName: firstName || undefined,
        dateOfBirth: dateOfBirth || undefined,
        street: street || undefined,
        houseNumber: houseNumber || undefined,
        zipCode: zipCode || undefined,
        municipality: municipality || undefined,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search BRP:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPerson = (person: Person) => {
    onPersonSelected(person);
    handleClose();
  };

  const handleClose = () => {
    setBsn('');
    setSurname('');
    setFirstName('');
    setDateOfBirth('');
    setStreet('');
    setHouseNumber('');
    setZipCode('');
    setMunicipality('');
    setSearchResults([]);
    setHasSearched(false);
    onClose();
  };

  // Check what fields are filled
  const hasBsn = bsn.length > 0;
  const hasSurname = surname.length > 0;
  const hasFirstName = firstName.length > 0;
  const hasDateOfBirth = dateOfBirth.length > 0;
  const hasStreet = street.length > 0;
  const hasHouseNumber = houseNumber.length > 0;
  const hasZipCode = zipCode.length > 0;
  const hasMunicipality = municipality.length > 0;

  // Determine which search track the user is on
  const onPersonTrack = hasSurname || hasFirstName || hasDateOfBirth;
  const onAddressTrack = hasStreet || hasHouseNumber || hasZipCode;

  // Disabled states for each field based on valid combinations:
  // 1. BSN (alone)
  // 2. Surname + DateOfBirth
  // 3. Surname + FirstName + Municipality
  // 4. HouseNumber + ZipCode
  // 5. Street + HouseNumber + Municipality
  const isBsnDisabled = onPersonTrack || onAddressTrack || hasMunicipality;
  const isSurnameDisabled = hasBsn || onAddressTrack;
  const isFirstNameDisabled = hasBsn || onAddressTrack || hasDateOfBirth;
  const isDateOfBirthDisabled = hasBsn || onAddressTrack || hasFirstName || hasMunicipality;
  const isStreetDisabled = hasBsn || onPersonTrack || hasZipCode;
  const isHouseNumberDisabled = hasBsn || onPersonTrack;
  const isZipCodeDisabled = hasBsn || onPersonTrack || hasStreet || hasMunicipality;
  const isMunicipalityDisabled = hasBsn || hasDateOfBirth || hasZipCode;

  // Check if a valid search combination is provided
  const isValidSearch =
    hasBsn ||
    (hasSurname && hasDateOfBirth) ||
    (hasSurname && hasFirstName && hasMunicipality) ||
    (hasHouseNumber && hasZipCode) ||
    (hasStreet && hasHouseNumber && hasMunicipality);

  // Combination availability for the guide display
  const isBsnComboAvailable = !onPersonTrack && !onAddressTrack && !hasMunicipality;
  const isSurnameDobComboAvailable = !hasBsn && !onAddressTrack && !hasFirstName && !hasMunicipality;
  const isSurnameFirstNameMunicipalityComboAvailable = !hasBsn && !onAddressTrack && !hasDateOfBirth;
  const isHouseNumberZipCodeComboAvailable = !hasBsn && !onPersonTrack && !hasStreet && !hasMunicipality;
  const isStreetHouseNumberMunicipalityComboAvailable = !hasBsn && !onPersonTrack && !hasZipCode;

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
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[80vw] max-w-none sm:max-w-none max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>BRP Raadplegen</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[300px_1fr] gap-6">
            {/* Left side - Form fields */}
            <div className="space-y-4">
              {/* BSN */}
              <div className="space-y-2">
                <Label htmlFor="brp-bsn">BSN</Label>
                <Input
                  id="brp-bsn"
                  placeholder="Voer een BSN in"
                  value={bsn}
                  onChange={(e) => setBsn(e.target.value)}
                  disabled={isBsnDisabled}
                />
              </div>

              {/* Surname */}
              <div className="space-y-2">
                <Label htmlFor="brp-surname">Achternaam</Label>
                <Input
                  id="brp-surname"
                  placeholder="Voer een achternaam in"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={isSurnameDisabled}
                />
              </div>

              {/* First names */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="brp-firstName">Voornamen</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Voer volledige voornamen in zoals geregistreerd in BRP</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="brp-firstName"
                  placeholder="Voer voornamen in"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isFirstNameDisabled}
                />
              </div>

              {/* Date of birth */}
              <div className="space-y-2">
                <Label htmlFor="brp-dob">Geboortedatum</Label>
                <Input
                  id="brp-dob"
                  type="date"
                  placeholder="Voer een geboortedatum in"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isDateOfBirthDisabled}
                />
              </div>

              {/* Street */}
              <div className="space-y-2">
                <Label htmlFor="brp-street">Straat</Label>
                <Input
                  id="brp-street"
                  placeholder="Voer een straatnaam in"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isStreetDisabled}
                />
              </div>

              {/* House number */}
              <div className="space-y-2">
                <Label htmlFor="brp-houseNumber">Huisnummer</Label>
                <Input
                  id="brp-houseNumber"
                  placeholder="Voer een huisnummer in"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  disabled={isHouseNumberDisabled}
                />
              </div>

              {/* Zip code */}
              <div className="space-y-2">
                <Label htmlFor="brp-zipCode">Postcode</Label>
                <Input
                  id="brp-zipCode"
                  placeholder="Voer een postcode in"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={isZipCodeDisabled}
                />
              </div>

              {/* Local authority */}
              <div className="space-y-2">
                <Label htmlFor="brp-municipality">Gemeente</Label>
                <Select value={municipality} onValueChange={setMunicipality} disabled={isMunicipalityDisabled}>
                  <SelectTrigger id="brp-municipality">
                    <SelectValue placeholder="Selecteer een gemeente" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUNICIPALITIES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right side - Search combinations guide or Results table */}
            {!hasSearched ? (
              <div className="flex flex-col">
                <p className="text-muted-foreground mb-4">
                  Voer een van de volgende combinaties in om te zoeken:
                </p>
                <div className="space-y-0">
                  {/* BSN */}
                  <div className={`py-3 transition-opacity ${!isBsnComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="font-medium pl-8">BSN</span>
                  </div>

                  {/* Divider with "or" */}
                  <div className={`flex items-center transition-opacity ${!isBsnComboAvailable && !isSurnameDobComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="text-muted-foreground text-sm pr-2">of</span>
                    <div className="flex-1 border-t" />
                  </div>

                  {/* Surname and date of birth */}
                  <div className={`py-3 transition-opacity ${!isSurnameDobComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="font-medium pl-8">Achternaam en geboortedatum</span>
                  </div>

                  {/* Divider with "or" */}
                  <div className={`flex items-center transition-opacity ${!isSurnameDobComboAvailable && !isSurnameFirstNameMunicipalityComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="text-muted-foreground text-sm pr-2">of</span>
                    <div className="flex-1 border-t" />
                  </div>

                  {/* Surname, first names and municipality */}
                  <div className={`py-3 transition-opacity ${!isSurnameFirstNameMunicipalityComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="font-medium pl-8">Achternaam, voornamen en gemeente</span>
                  </div>

                  {/* Divider with "or" */}
                  <div className={`flex items-center transition-opacity ${!isSurnameFirstNameMunicipalityComboAvailable && !isHouseNumberZipCodeComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="text-muted-foreground text-sm pr-2">of</span>
                    <div className="flex-1 border-t" />
                  </div>

                  {/* House number and zip code */}
                  <div className={`py-3 transition-opacity ${!isHouseNumberZipCodeComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="font-medium pl-8">Huisnummer en postcode</span>
                  </div>

                  {/* Divider with "or" */}
                  <div className={`flex items-center transition-opacity ${!isHouseNumberZipCodeComboAvailable && !isStreetHouseNumberMunicipalityComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="text-muted-foreground text-sm pr-2">of</span>
                    <div className="flex-1 border-t" />
                  </div>

                  {/* Street, house number and municipality */}
                  <div className={`py-3 transition-opacity ${!isStreetHouseNumberMunicipalityComboAvailable ? 'opacity-30' : ''}`}>
                    <span className="font-medium pl-8">Straat, huisnummer en gemeente</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voornaam</TableHead>
                      <TableHead>Achternaam</TableHead>
                      <TableHead>BSN</TableHead>
                      <TableHead>Geslacht</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Geen resultaten gevonden.
                        </TableCell>
                      </TableRow>
                    ) : (
                      searchResults.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">{person.firstName}</TableCell>
                          <TableCell>{person.surname}</TableCell>
                          <TableCell>{person.bsn || '-'}</TableCell>
                          <TableCell>{person.gender || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => handleSelectPerson(person)}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t pt-4 mt-4">
          <Button
            onClick={handleSearch}
            disabled={!isValidSearch || isSearching}
          >
            {isSearching ? 'Zoeken...' : 'Zoeken'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
