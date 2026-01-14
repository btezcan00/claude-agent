'use client';

import { SignalAttachment, ALLOWED_FILE_TYPES } from '@/types/signal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface AttachmentPreviewDialogProps {
  attachment: SignalAttachment | null;
  open: boolean;
  onClose: () => void;
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onClose,
}: AttachmentPreviewDialogProps) {
  if (!attachment) return null;

  const isImage = ALLOWED_FILE_TYPES.images.includes(attachment.fileType as typeof ALLOWED_FILE_TYPES.images[number]);
  const isPdf = attachment.fileType === 'application/pdf';
  const isText = attachment.fileType === 'text/plain' || attachment.fileType === 'text/csv';

  const handleDownload = () => {
    if (!attachment.content) return;
    const link = document.createElement('a');
    link.href = attachment.content;
    link.download = attachment.fileName;
    link.click();
  };

  const canPreview = attachment.content && (isImage || isPdf || isText);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span className="truncate">{attachment.fileName}</span>
            {attachment.content && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(attachment.fileSize)} - {attachment.fileType}
          </p>
        </DialogHeader>

        <div className="mt-4">
          {!attachment.content ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>This is a legacy attachment without file content.</p>
              <p className="text-sm">Only metadata is available.</p>
            </div>
          ) : isImage ? (
            <img
              src={attachment.content}
              alt={attachment.fileName}
              className="max-w-full h-auto mx-auto rounded-lg"
            />
          ) : isPdf ? (
            <iframe
              src={attachment.content}
              className="w-full h-[600px] border rounded-lg"
              title={attachment.fileName}
            />
          ) : isText && attachment.textContent ? (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-sm whitespace-pre-wrap">
              {attachment.textContent}
            </pre>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Preview not available for this file type.</p>
              <p className="text-sm">Click Download to view the file.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
