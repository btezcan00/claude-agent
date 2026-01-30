'use client';

import Link from 'next/link';
import { useCases } from '@/context/case-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/date-utils';
import { FolderOpen, User } from 'lucide-react';

export function CaseList() {
  const { filteredCases, getSignalCountForCase } = useCases();

  if (filteredCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No cases found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create a case to organize your signals.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Case</TableHead>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[100px]">Signals</TableHead>
            <TableHead className="w-[150px]">Owner</TableHead>
            <TableHead className="w-[120px]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.map((caseItem) => {
            const signalCount = getSignalCountForCase(caseItem.id);

            return (
              <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/cases/${caseItem.id}`} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: caseItem.color ? `${caseItem.color}20` : 'hsl(var(--muted))',
                        color: caseItem.color || 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm hover:text-primary transition-colors">
                      {caseItem.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {caseItem.description}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{signalCount}</span>
                </TableCell>
                <TableCell>
                  {caseItem.ownerName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {caseItem.ownerName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">
                        {caseItem.ownerName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No owner
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeTime(caseItem.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
