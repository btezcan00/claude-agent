'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFolders } from '@/context/folder-context';
import { Folder } from '@/types/folder';
import { FolderDetailHeader } from '@/components/folders/folder-detail-header';
import { FolderStatusRoadmap } from '@/components/folders/folder-status-roadmap';
import { FolderDetailInfo } from '@/components/folders/folder-detail-info';
import { FolderNotes } from '@/components/folders/folder-notes';
import { FolderSignalsList } from '@/components/folders/folder-signals-list';
import { FolderEditDialog } from '@/components/folders/folder-edit-dialog';
import { FolderApplicationDialog } from '@/components/folders/folder-application-dialog';
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
import { FolderAddSignalsDialog } from '@/components/folders/folder-add-signals-dialog';

export default function FolderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getFolderById, deleteFolder, folders } = useFolders();
  const [folder, setFolder] = useState<Folder | null | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [addSignalsDialogOpen, setAddSignalsDialogOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const foundFolder = getFolderById(id);
    setFolder(foundFolder || null);
  }, [params.id, getFolderById, folders]);

  const handleDelete = () => {
    if (folder) {
      deleteFolder(folder.id);
      router.push('/folders');
    }
  };

  // Loading state
  if (folder === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Not found state
  if (folder === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Folder Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The folder you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/folders')}
          className="text-primary hover:underline"
        >
          Return to Folders
        </button>
      </div>
    );
  }

  // Check if application is not completed
  const isApplicationPending = folder.status === 'application' && !folder.applicationData?.isCompleted;

  return (
    <div className="space-y-6">
      <FolderDetailHeader
        folder={folder}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Status Roadmap */}
      <FolderStatusRoadmap folder={folder} />

      {/* Application Pending State */}
      {isApplicationPending ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Pending</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This folder is in the application phase. Complete the Bibob test application
              to access folder details and start research.
            </p>
            <Button onClick={() => setApplicationDialogOpen(true)}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Complete Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Main Content - Two Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-1 space-y-6">
            <FolderDetailInfo folder={folder} />
          </div>

          {/* Right Column - Notes and Signals */}
          <div className="lg:col-span-2 space-y-6">
            <FolderNotes folder={folder} />

            {/* Signals in Folder */}
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
              <FolderSignalsList folder={folder} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <FolderEditDialog
        folder={folder}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this folder? This action cannot be
              undone. Signals in this folder will not be deleted, only removed
              from this folder.
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
      <FolderApplicationDialog
        folder={folder}
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onStartResearch={() => {
          setApplicationDialogOpen(false);
        }}
      />

      {/* Add Signals Dialog */}
      <FolderAddSignalsDialog
        folder={folder}
        open={addSignalsDialogOpen}
        onClose={() => setAddSignalsDialogOpen(false)}
      />
    </div>
  );
}
