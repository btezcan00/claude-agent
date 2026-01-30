'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCases } from '@/context/case-context';
import { Case } from '@/types/case';
import { CaseDetailHeader } from '@/components/cases/case-detail-header';
import { CaseStatusRoadmap } from '@/components/cases/case-status-roadmap';
import { CaseDetailInfo } from '@/components/cases/case-detail-info';
import { CaseOrganizations } from '@/components/cases/case-organizations';
import { CaseAddresses } from '@/components/cases/case-addresses';
import { CasePeopleInvolved } from '@/components/cases/case-people-involved';
import { CaseLetters } from '@/components/cases/case-letters';
import { CaseFindings } from '@/components/cases/case-findings';
import { CaseAttachments } from '@/components/cases/case-attachments';
import { CaseRecords } from '@/components/cases/case-records';
import { CaseCommunications } from '@/components/cases/case-communications';
import { CaseSuggestions } from '@/components/cases/case-suggestions';
import { CaseVisualizations } from '@/components/cases/case-visualizations';
import { CaseActivities } from '@/components/cases/case-activities';
import { CaseNotes } from '@/components/cases/case-notes';
import { CaseSignalsList } from '@/components/cases/case-signals-list';
import { CaseApplicationDialog } from '@/components/cases/case-application-dialog';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, ClipboardList, Plus } from 'lucide-react';
import { CaseAddSignalsDialog } from '@/components/cases/case-add-signals-dialog';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getCaseById, deleteCase, cases } = useCases();
  const [caseItem, setCaseItem] = useState<Case | null | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [addSignalsDialogOpen, setAddSignalsDialogOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const foundCase = getCaseById(id);
    setCaseItem(foundCase || null);
  }, [params.id, getCaseById, cases]);

  const handleDelete = async () => {
    if (caseItem) {
      await deleteCase(caseItem.id);
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
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
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

  // Check if application is not completed
  const isApplicationPending = caseItem.status === 'application' && !caseItem.applicationData?.isCompleted;

  return (
    <div className="space-y-6">
      <CaseDetailHeader
        caseItem={caseItem}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Status Roadmap */}
      <CaseStatusRoadmap caseItem={caseItem} />

      {/* Application Pending State */}
      {isApplicationPending ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Pending</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This case is in the application phase. Complete the Bibob test application
              to access case details and start research.
            </p>
            <Button onClick={() => setApplicationDialogOpen(true)}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Complete Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-1 space-y-6">
              <CaseDetailInfo caseItem={caseItem} />
            </div>

            {/* Right Column - Notes and Signals */}
            <div className="lg:col-span-2 space-y-6">
              <CaseNotes caseItem={caseItem} />

              {/* Signals in Case */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Signals</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddSignalsDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <CaseSignalsList caseItem={caseItem} />
              </div>
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="space-y-6">
            <CaseOrganizations caseItem={caseItem} />
            <CaseAddresses caseItem={caseItem} />
            <CasePeopleInvolved caseItem={caseItem} />
            <CaseLetters caseItem={caseItem} />
            <CaseFindings caseItem={caseItem} />
            <CaseAttachments caseItem={caseItem} />
            <CaseRecords caseItem={caseItem} />
            <CaseCommunications caseItem={caseItem} />
            <CaseSuggestions caseItem={caseItem} />
            <CaseVisualizations caseItem={caseItem} />
            <CaseActivities caseItem={caseItem} />
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This action cannot be
              undone. Signals in this case will not be deleted, only removed
              from this case.
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

      {/* Application Dialog */}
      <CaseApplicationDialog
        caseItem={caseItem}
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onStartResearch={() => {
          setApplicationDialogOpen(false);
        }}
      />

      {/* Add Signals Dialog */}
      <CaseAddSignalsDialog
        caseItem={caseItem}
        open={addSignalsDialogOpen}
        onClose={() => setAddSignalsDialogOpen(false)}
      />
    </div>
  );
}
