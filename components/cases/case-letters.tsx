'use client';

import { useState, useMemo } from 'react';
import { Case, LetterItem, LETTER_TEMPLATES } from '@/types/case';
import { useCases } from '@/context/case-context';
import { Mail, Plus, MoreHorizontal, Filter, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { AddLetterDialog } from './add-letter-dialog';
import { LetterDocumentViewer } from './letter-document-viewer';

interface CaseLettersProps {
  caseItem: Case;
}

const ITEMS_PER_PAGE = 10;

export function CaseLetters({ caseItem }: CaseLettersProps) {
  const { addLetter, removeLetter, updateLetter } = useCases();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);

  // Filter states
  const [titleFilter, setTitleFilter] = useState<string[]>([]);
  const [createdByFilter, setCreatedByFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  const letters = useMemo(() => caseItem.letters || [], [caseItem.letters]);

  // Get unique values for filters
  const uniqueTitles = useMemo(() => [...new Set(letters.map((l) => l.name))], [letters]);
  const uniqueCreatedBy = useMemo(() => [...new Set(letters.map((l) => `${l.createdByFirstName} ${l.createdBySurname}`))], [letters]);
  const uniqueTags = useMemo(() => [...new Set(letters.flatMap((l) => l.tags))], [letters]);

  // Apply filters
  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      if (titleFilter.length > 0 && !titleFilter.includes(letter.name)) return false;
      if (createdByFilter.length > 0 && !createdByFilter.includes(`${letter.createdByFirstName} ${letter.createdBySurname}`)) return false;
      if (tagsFilter.length > 0 && !letter.tags.some((t) => tagsFilter.includes(t))) return false;
      return true;
    });
  }, [letters, titleFilter, createdByFilter, tagsFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLetters.length / ITEMS_PER_PAGE);
  const paginatedLetters = filteredLetters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIndex = filteredLetters.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredLetters.length);

  const handleAddLetter = async (data: { name: string; template: string }) => {
    const newLetter = await addLetter(caseItem.id, {
      name: data.name,
      template: data.template,
      description: '',
      tags: [],
    });
    if (newLetter) {
      setSelectedLetter(newLetter);
    }
  };

  const handleDescriptionChange = (letterId: string, description: string) => {
    updateLetter(caseItem.id, letterId, { description });
  };

  const handleSaveFieldData = (fieldData: Record<string, string | boolean>) => {
    if (selectedLetter) {
      updateLetter(caseItem.id, selectedLetter.id, { fieldData });
    }
  };

  const handleViewLetter = (letter: LetterItem) => {
    setSelectedLetter(letter);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getTemplateLabel = (templateValue: string) => {
    const template = LETTER_TEMPLATES.find((t) => t.value === templateValue);
    const label = template?.label || templateValue;
    return label.length > 40 ? `${label.slice(0, 40)}...` : label;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Mail className="h-4 w-4" />
            Brieven ({filteredLetters.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {letters.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nog geen brieven toegevoegd. Klik op + om een document toe te voegen.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Titel
                        <FilterPopover
                          options={uniqueTitles}
                          selected={titleFilter}
                          onChange={setTitleFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Aangemaakt door
                        <FilterPopover
                          options={uniqueCreatedBy}
                          selected={createdByFilter}
                          onChange={setCreatedByFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Tags
                        <FilterPopover
                          options={uniqueTags}
                          selected={tagsFilter}
                          onChange={setTagsFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Laatst bijgewerkt</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLetters.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{letter.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {getTemplateLabel(letter.template)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{letter.createdByFirstName}</div>
                          <div className="text-muted-foreground">{letter.createdBySurname}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={letter.description}
                          onChange={(e) => handleDescriptionChange(letter.id, e.target.value)}
                          placeholder="Omschrijving toevoegen..."
                          className="h-8 min-w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {letter.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(letter.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewLetter(letter)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Bekijken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => removeLetter(caseItem.id, letter.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {startIndex}-{endIndex}/{filteredLetters.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddLetterDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddLetter}
      />

      {selectedLetter && (
        <LetterDocumentViewer
          letter={selectedLetter}
          open={!!selectedLetter}
          onClose={() => setSelectedLetter(null)}
          onSave={handleSaveFieldData}
        />
      )}
    </>
  );
}

interface FilterPopoverProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function FilterPopover({ options, selected, onChange }: FilterPopoverProps) {
  if (options.length === 0) return null;

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const hasFilters = selected.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${hasFilters ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => handleToggle(option)}
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => onChange([])}
            >
              Filter wissen
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
