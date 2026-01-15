'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Signal,
  ALLOWED_FILE_TYPES,
  ALL_ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_TOTAL_ATTACHMENTS_SIZE,
  SignalAttachment,
} from '@/types/signal';
import { useSignals } from '@/context/signal-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { AttachmentPreviewDialog } from './attachment-preview-dialog';

interface SignalAttachmentsProps {
  signal: Signal;
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('spreadsheet') || fileType.includes('excel'))
    return FileSpreadsheet;
  if (fileType.includes('image')) return FileImage;
  return File;
}

export function SignalAttachments({ signal }: SignalAttachmentsProps) {
  const { addAttachment, removeAttachment } = useSignals();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<SignalAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate current total size
  const currentTotalSize = signal.attachments.reduce((sum, a) => sum + a.fileSize, 0);
  const storageUsedPercent = Math.round((currentTotalSize / MAX_TOTAL_ATTACHMENTS_SIZE) * 100);

  const validateFile = (file: File): string | null => {
    if (!ALL_ALLOWED_FILE_TYPES.includes(file.type as typeof ALL_ALLOWED_FILE_TYPES[number])) {
      return `File type "${file.type || 'unknown'}" is not supported. Allowed: images, PDF, Word, Excel, text files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" (${formatFileSize(file.size)}) exceeds maximum of ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENTS_SIZE) {
      return `Adding "${file.name}" would exceed the ${formatFileSize(MAX_TOTAL_ATTACHMENTS_SIZE)} storage limit for this signal.`;
    }
    return null;
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromPdf = async (base64Content: string): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const base64Data = base64Content.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += `[Page ${i}]\n${pageText}\n\n`;
      }

      return fullText.substring(0, 50000);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  };

  const extractTextFromFile = async (file: File, base64Content: string): Promise<string | undefined> => {
    if (file.type === 'text/plain' || file.type === 'text/csv') {
      try {
        const base64Data = base64Content.split(',')[1];
        const textContent = atob(base64Data);
        return textContent.substring(0, 10000);
      } catch {
        return undefined;
      }
    }
    if (file.type === 'application/pdf') {
      const pdfText = await extractTextFromPdf(base64Content);
      return pdfText || undefined;
    }
    return undefined;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        continue;
      }

      try {
        const base64Content = await readFileAsBase64(file);
        const textContent = await extractTextFromFile(file, base64Content);

        addAttachment(signal.id, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: 'Current User',
          content: base64Content,
          textContent,
        });
      } catch {
        setUploadError(`Failed to upload "${file.name}". Please try again.`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [signal.id, currentTotalSize]);

  const handleDownload = (attachment: SignalAttachment) => {
    if (!attachment.content) return;
    const link = document.createElement('a');
    link.href = attachment.content;
    link.download = attachment.fileName;
    link.click();
  };

  const handleDelete = (attachmentId: string) => {
    removeAttachment(signal.id, attachmentId);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments ({signal.attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Paperclip className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Drag and drop files here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ALL_ALLOWED_FILE_TYPES.join(',')}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Max {formatFileSize(MAX_FILE_SIZE)} per file
            </p>
          </div>

          {/* Storage Usage */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Storage used</span>
              <span>
                {formatFileSize(currentTotalSize)} / {formatFileSize(MAX_TOTAL_ATTACHMENTS_SIZE)}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  storageUsedPercent > 80 ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{uploadError}</p>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto text-destructive hover:text-destructive/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Attachments List */}
          {signal.attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {signal.attachments.map((attachment) => {
                  const Icon = getFileIcon(attachment.fileType);
                  const hasContent = !!attachment.content;

                  return (
                    <div
                      key={attachment.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        hasContent
                          ? 'hover:bg-muted/50 cursor-pointer'
                          : 'opacity-75'
                      }`}
                      onClick={() => hasContent && setPreviewAttachment(attachment)}
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
                          <span>-</span>
                          <span>{formatRelativeTime(attachment.uploadedAt)}</span>
                          {!hasContent && (
                            <>
                              <span>-</span>
                              <span className="text-amber-600">Legacy</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasContent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(attachment);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(attachment.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}
