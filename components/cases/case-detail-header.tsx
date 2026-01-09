'use client';

import Link from 'next/link';
import { Case, CaseStatus } from '@/types/case';
import { useCases } from '@/context/case-context';
import { Button } from '@/components/ui/button';
import { CaseStatusBadge } from './case-status-badge';
import { CasePriorityBadge } from './case-priority-badge';
import { CaseTypeBadge } from './case-type-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, ChevronDown, Edit, UserPlus, Trash2 } from 'lucide-react';
import { CASE_STATUSES, CASE_STATUS_CONFIG, STATUS_WORKFLOW } from '@/lib/constants';

interface CaseDetailHeaderProps {
  caseItem: Case;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
}

export function CaseDetailHeader({
  caseItem,
  onEdit,
  onAssign,
  onDelete,
}: CaseDetailHeaderProps) {
  const { updateStatus } = useCases();

  const allowedStatuses = STATUS_WORKFLOW[caseItem.status];

  const handleStatusChange = (newStatus: CaseStatus) => {
    updateStatus(caseItem.id, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {caseItem.caseNumber}
            </span>
            <CaseTypeBadge type={caseItem.type} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{caseItem.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CaseStatusBadge status={caseItem.status} />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {allowedStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                  >
                    {CASE_STATUS_CONFIG[status].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <CasePriorityBadge priority={caseItem.priority} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAssign}>
            <UserPlus className="w-4 h-4 mr-2" />
            {caseItem.assigneeId ? 'Reassign' : 'Assign'}
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
