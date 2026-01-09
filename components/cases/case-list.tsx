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
import { CaseStatusBadge } from './case-status-badge';
import { CasePriorityBadge } from './case-priority-badge';
import { CaseTypeBadge } from './case-type-badge';
import { formatDate, formatRelativeTime, isOverdue } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export function CaseList() {
  const { filteredCases } = useCases();

  if (filteredCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No cases found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your search or filter criteria to find what you&apos;re
          looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[140px]">Case #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[150px]">Assignee</TableHead>
            <TableHead className="w-[120px]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.map((caseItem) => {
            const overdue =
              isOverdue(caseItem.dueDate) && caseItem.status !== 'closed';

            return (
              <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/cases/${caseItem.id}`}
                    className="font-mono text-xs hover:text-primary transition-colors"
                  >
                    {caseItem.caseNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cases/${caseItem.id}`} className="block">
                    <p
                      className={cn(
                        'font-medium text-sm hover:text-primary transition-colors line-clamp-1',
                        overdue && 'text-destructive'
                      )}
                    >
                      {caseItem.title}
                    </p>
                    {caseItem.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {caseItem.location}
                      </p>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <CaseTypeBadge type={caseItem.type} />
                </TableCell>
                <TableCell>
                  <CaseStatusBadge status={caseItem.status} />
                </TableCell>
                <TableCell>
                  <CasePriorityBadge priority={caseItem.priority} />
                </TableCell>
                <TableCell>
                  {caseItem.assigneeName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {caseItem.assigneeName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">
                        {caseItem.assigneeName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
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
