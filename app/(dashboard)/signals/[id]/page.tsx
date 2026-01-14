'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSignals } from '@/context/signal-context';
import { Signal } from '@/types/signal';
import { SignalDetailHeader } from '@/components/signals/signal-detail-header';
import { SignalDetailInfo } from '@/components/signals/signal-detail-info';
import { SignalNotes } from '@/components/signals/signal-notes';
import { SignalActivityTimeline } from '@/components/signals/signal-activity-timeline';
import { SignalAttachments } from '@/components/signals/signal-attachments';
import { SignalEditDialog } from '@/components/signals/signal-edit-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

export default function SignalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getSignalById, deleteSignal, signals } = useSignals();
  const [signal, setSignal] = useState<Signal | null | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const foundSignal = getSignalById(id);
    setSignal(foundSignal || null);
  }, [params.id, getSignalById, signals]);

  const handleDelete = () => {
    if (signal) {
      deleteSignal(signal.id);
      router.push('/signals');
    }
  };

  // Loading state
  if (signal === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Not found state
  if (signal === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Signal Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The signal you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/signals')}
          className="text-primary hover:underline"
        >
          Return to Signals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SignalDetailHeader
        signal={signal}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SignalDetailInfo signal={signal} />
          <SignalAttachments signal={signal} />
        </div>
        <div className="space-y-6">
          <SignalNotes signal={signal} />
          <SignalActivityTimeline signal={signal} />
        </div>
      </div>

      {/* Edit Dialog */}
      <SignalEditDialog
        signal={signal}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Signal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this signal? This action cannot be
              undone. All notes, attachments, and activity history will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
