'use client';

import Link from 'next/link';
import { Folder } from '@/types/folder';
import { useSignals } from '@/context/signal-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SignalStatusBadge } from '@/components/signals/signal-status-badge';
import { SignalTypeBadge } from '@/components/signals/signal-type-badge';
import { formatRelativeTime } from '@/lib/date-utils';
import { Radio, X } from 'lucide-react';
import { SIGNAL_SOURCE_CONFIG } from '@/lib/constants';

interface FolderSignalsListProps {
  folder: Folder;
}

export function FolderSignalsList({ folder }: FolderSignalsListProps) {
  const { getSignalsByFolderId, removeSignalFromFolder } = useSignals();
  const signals = getSignalsByFolderId(folder.id);

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No signals in this folder</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add signals to this folder by selecting them from the Signals page.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[140px]">Signal #</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-[200px]">Type(s)</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[130px]">Source</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => {
            return (
              <TableRow key={signal.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/signals/${signal.id}`}
                    className="font-mono text-xs hover:text-primary transition-colors"
                  >
                    {signal.signalNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/signals/${signal.id}`} className="block">
                    <p className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">
                      {signal.placeOfObservation}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {signal.description}
                    </p>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(signal.types || []).map((type) => (
                      <SignalTypeBadge key={type} type={type} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <SignalStatusBadge status={signal.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {signal.receivedBy && SIGNAL_SOURCE_CONFIG[signal.receivedBy]?.label || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeSignalFromFolder(signal.id, folder.id);
                    }}
                    title="Remove from folder"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
