'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCases } from '@/context/case-context';
import { Case } from '@/types/case';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaseDetailHeader } from '@/components/cases/case-detail-header';
import { CaseDetailInfo } from '@/components/cases/case-detail-info';
import { CaseNotes } from '@/components/cases/case-notes';
import { CaseActivityTimeline } from '@/components/cases/case-activity-timeline';
import { CaseAttachments } from '@/components/cases/case-attachments';
import { CaseEditDialog } from '@/components/cases/case-edit-dialog';
import { CaseAssignDialog } from '@/components/cases/case-assign-dialog';
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
import { FileText, MessageSquare, Activity, Paperclip } from 'lucide-react';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getCaseById, deleteCase, cases } = useCases();
  const [caseItem, setCaseItem] = useState<Case | null | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const foundCase = getCaseById(id);
    setCaseItem(foundCase || null);
  }, [params.id, getCaseById, cases]);

  const handleDelete = () => {
    if (caseItem) {
      deleteCase(caseItem.id);
      router.push('/cases');
    }
  };

  // Loading state
  if (caseItem === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Not found state
  if (caseItem === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Case Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The case you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/cases')}
          className="text-primary hover:underline"
        >
          Return to Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CaseDetailHeader
        caseItem={caseItem}
        onEdit={() => setEditDialogOpen(true)}
        onAssign={() => setAssignDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes
            {caseItem.notes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                {caseItem.notes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments
            {caseItem.attachments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                {caseItem.attachments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CaseDetailInfo caseItem={caseItem} />
        </TabsContent>

        <TabsContent value="notes">
          <CaseNotes caseItem={caseItem} />
        </TabsContent>

        <TabsContent value="activity">
          <CaseActivityTimeline caseItem={caseItem} />
        </TabsContent>

        <TabsContent value="attachments">
          <CaseAttachments caseItem={caseItem} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <CaseEditDialog
        caseItem={caseItem}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Assign Dialog */}
      <CaseAssignDialog
        caseItem={caseItem}
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This action cannot be
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
