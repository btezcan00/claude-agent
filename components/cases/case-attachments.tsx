'use client';

import { Case } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Paperclip,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
} from 'lucide-react';

interface CaseAttachmentsProps {
  caseItem: Case;
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('spreadsheet') || fileType.includes('excel'))
    return FileSpreadsheet;
  if (fileType.includes('image')) return FileImage;
  return File;
}

export function CaseAttachments({ caseItem }: CaseAttachmentsProps) {
  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Attachment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              (Upload functionality is UI-only in this demo)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments ({caseItem.attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caseItem.attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No attachments</p>
              <p className="text-sm">Upload files to attach them to this case</p>
            </div>
          ) : (
            <div className="space-y-2">
              {caseItem.attachments.map((attachment) => {
                const Icon = getFileIcon(attachment.fileType);

                return (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {attachment.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {attachment.uploadedBy}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(attachment.uploadedAt)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
