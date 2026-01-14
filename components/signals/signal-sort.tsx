'use client';

import { useSignals } from '@/context/signal-context';
import { SortField, SortOrder } from '@/types/signal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'createdAt', label: 'Created Date' },
  { field: 'updatedAt', label: 'Updated Date' },
  { field: 'timeOfObservation', label: 'Observation Time' },
  { field: 'status', label: 'Status' },
];

export function SignalSort() {
  const { sortOption, setSortOption } = useSignals();

  const handleFieldChange = (field: SortField) => {
    setSortOption({ ...sortOption, field });
  };

  const toggleOrder = () => {
    setSortOption({
      ...sortOption,
      order: sortOption.order === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={sortOption.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.field} value={option.field}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={toggleOrder}
      >
        {sortOption.order === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
