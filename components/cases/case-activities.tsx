'use client';

import { useState, useMemo } from 'react';
import { Case, ActivityItem } from '@/types/case';
import { useCases } from '@/context/case-context';
import { Activity, Plus, MoreHorizontal, Filter, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { AddItemDialog } from './add-item-dialog';

interface CaseActivitiesProps {
  caseItem: Case;
}

const ITEMS_PER_PAGE = 10;

type SortDirection = 'asc' | 'desc' | null;

export function CaseActivities({ caseItem }: CaseActivitiesProps) {
  const { addActivity, removeActivity } = useCases();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort state for Datum column
  const [dateSortDirection, setDateSortDirection] = useState<SortDirection>(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState<string[]>([]);
  const [nameFilter, setNameFilter] = useState<string[]>([]);
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [lastEditedFilter, setLastEditedFilter] = useState<string[]>([]);

  const activities = useMemo(() => caseItem.activities || [], [caseItem.activities]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's not a valid ISO date, return as is (for legacy format)
      return dateString;
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Get unique values for filters
  const uniqueDates = useMemo(() => [...new Set(activities.map((a) => formatDate(a.date)))], [activities]);
  const uniqueNames = useMemo(() => [...new Set(activities.map((a) => a.createdByName || 'Unknown'))], [activities]);
  const uniqueLabels = useMemo(() => [...new Set(activities.map((a) => a.label))], [activities]);
  const uniqueLastEdited = useMemo(() => [...new Set(activities.map((a) => a.updatedAt ? formatDate(a.updatedAt) : 'N/A'))], [activities]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (dateFilter.length > 0 && !dateFilter.includes(formatDate(activity.date))) return false;
      if (nameFilter.length > 0 && !nameFilter.includes(activity.createdByName || 'Unknown')) return false;
      if (labelFilter.length > 0 && !labelFilter.includes(activity.label)) return false;
      if (lastEditedFilter.length > 0) {
        const formattedUpdatedAt = activity.updatedAt ? formatDate(activity.updatedAt) : 'N/A';
        if (!lastEditedFilter.includes(formattedUpdatedAt)) return false;
      }
      return true;
    });
  }, [activities, dateFilter, nameFilter, labelFilter, lastEditedFilter]);

  // Apply sorting
  const sortedActivities = useMemo(() => {
    if (!dateSortDirection) return filteredActivities;

    return [...filteredActivities].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // Handle invalid dates
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredActivities, dateSortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIndex = sortedActivities.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, sortedActivities.length);

  const handleAddActivity = (item: { date: string; phase: typeof caseItem.status; label: string; description: string }) => {
    addActivity(caseItem.id, item);
  };

  const toggleDateSort = () => {
    if (dateSortDirection === null) {
      setDateSortDirection('asc');
    } else if (dateSortDirection === 'asc') {
      setDateSortDirection('desc');
    } else {
      setDateSortDirection(null);
    }
  };

  const getSortIcon = () => {
    if (dateSortDirection === 'asc') return <ArrowUp className="h-3 w-3" />;
    if (dateSortDirection === 'desc') return <ArrowDown className="h-3 w-3" />;
    return <ArrowUpDown className="h-3 w-3" />;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Activity className="h-4 w-4" />
            Activiteiten ({filteredActivities.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nog geen activiteiten toegevoegd. Klik op + om een activiteit toe te voegen.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={toggleDateSort}
                        >
                          Datum
                          <span className="ml-1">{getSortIcon()}</span>
                        </Button>
                        <FilterPopover
                          options={uniqueDates}
                          selected={dateFilter}
                          onChange={setDateFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Naam
                        <FilterPopover
                          options={uniqueNames}
                          selected={nameFilter}
                          onChange={setNameFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Label
                        <FilterPopover
                          options={uniqueLabels}
                          selected={labelFilter}
                          onChange={setLabelFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Laatst bewerkt
                        <FilterPopover
                          options={uniqueLastEdited}
                          selected={lastEditedFilter}
                          onChange={setLastEditedFilter}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-sm">
                        {formatDate(activity.date)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {activity.createdByName || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.label}
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px]">
                        <span className="line-clamp-2">{activity.description}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {activity.updatedAt ? formatDate(activity.updatedAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => removeActivity(caseItem.id, activity.id)}
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
                  {startIndex}-{endIndex}/{sortedActivities.length}
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

      <AddItemDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddActivity}
        currentPhase={caseItem.status}
        title="Activiteit Toevoegen"
      />
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
        <div className="space-y-1 max-h-60 overflow-y-auto">
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
