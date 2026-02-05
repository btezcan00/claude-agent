'use client';

import Link from 'next/link';
import { Signal } from '@/types/signal';
import { Button } from '@/components/ui/button';
import { SignalTypeBadge } from './signal-type-badge';
import { ArrowLeft, Edit, Trash2, FolderPlus } from 'lucide-react';
import { CaseCreateDialog } from '@/components/cases/case-create-dialog';

interface SignalDetailHeaderProps {
  signal: Signal;
  onEdit: () => void;
  onDelete: () => void;
}

export function SignalDetailHeader({
  signal,
  onEdit,
  onDelete,
}: SignalDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back Navigation */}
      <Link
        href="/meldingen"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar Meldingen
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-semibold">
              {signal.signalNumber}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(signal.types || []).map((type) => (
              <SignalTypeBadge key={type} type={type} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <CaseCreateDialog signalIds={[signal.id]}>
            <Button variant="outline" size="sm">
              <FolderPlus className="w-4 h-4 mr-2" />
              Dossier Aanmaken
            </Button>
          </CaseCreateDialog>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Bewerken
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
