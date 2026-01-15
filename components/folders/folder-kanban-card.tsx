'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder, FOLDER_STATUSES } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/lib/date-utils';
import { FolderOpen, User, Radio } from 'lucide-react';
import { FolderApplicationDialog } from './folder-application-dialog';

interface FolderKanbanCardProps {
  folder: Folder;
}

export function FolderKanbanCard({ folder }: FolderKanbanCardProps) {
  const router = useRouter();
  const { getSignalCountForFolder } = useFolders();
  const signalCount = getSignalCountForFolder(folder.id);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);

  const currentStatusConfig = FOLDER_STATUSES.find((s) => s.value === folder.status);
  const currentStatusDate = folder.statusDates?.[folder.status];

  const isApplicationStatus = folder.status === 'application';

  const handleCardClick = () => {
    if (isApplicationStatus) {
      setApplicationDialogOpen(true);
    }
  };

  const handleStartResearch = () => {
    setApplicationDialogOpen(false);
    router.push(`/folders/${folder.id}`);
  };

  const cardContent = (
    <Card
      className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4"
      style={{ borderLeftColor: folder.color || 'transparent' }}
      onClick={isApplicationStatus ? handleCardClick : undefined}
    >
        <div className="space-y-2">
          {/* Header with folder name */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{
                backgroundColor: folder.color ? `${folder.color}20` : 'hsl(var(--muted))',
                color: folder.color || 'hsl(var(--muted-foreground))',
              }}
            >
              <FolderOpen className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {folder.name}
            </h3>
          </div>

          {/* Signals count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Radio className="w-3 h-3" />
            <span>{signalCount} {signalCount === 1 ? 'signal' : 'signals'}</span>
          </div>

          {/* Status date */}
          {currentStatusDate && (
            <div className="text-xs text-muted-foreground">
              In {currentStatusConfig?.shortLabel} since {formatDate(currentStatusDate)}
            </div>
          )}

          {/* Footer with owner */}
          <div className="flex items-center justify-between pt-2 border-t">
            {folder.ownerName ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {folder.ownerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {folder.ownerName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>No owner</span>
              </div>
            )}
          </div>
        </div>
      </Card>
  );

  return (
    <>
      {isApplicationStatus ? (
        cardContent
      ) : (
        <Link href={`/folders/${folder.id}`}>
          {cardContent}
        </Link>
      )}

      <FolderApplicationDialog
        folder={folder}
        open={applicationDialogOpen}
        onClose={() => setApplicationDialogOpen(false)}
        onStartResearch={handleStartResearch}
      />
    </>
  );
}
