'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFolders } from '@/context/folder-context';
import { Folder } from '@/types/folder';
import { FolderDetailHeader } from '@/components/folders/folder-detail-header';
import { FolderSignalsList } from '@/components/folders/folder-signals-list';
import { FolderEditDialog } from '@/components/folders/folder-edit-dialog';
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
import { FolderOpen } from 'lucide-react';

export default function FolderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getFolderById, deleteFolder, folders } = useFolders();
  const [folder, setFolder] = useState<Folder | null | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <FolderDetailHeader
        folder={folder}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Signals in Folder */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Signals in this folder</h2>
        <FolderSignalsList folder={folder} />
      </div>

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
    </div>
  );
}
