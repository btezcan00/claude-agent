'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Signal,
  SignalPhoto,
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTOS,
  MAX_FILE_SIZE,
  MAX_TOTAL_PHOTOS_SIZE,
} from '@/types/signal';
import { useSignals } from '@/context/signal-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { formatFileSize } from '@/lib/utils';
import {
  Image,
  Upload,
  Trash2,
  AlertCircle,
  X,
  ZoomIn,
} from 'lucide-react';

interface SignalPhotosProps {
  signal: Signal;
}

export function SignalPhotos({ signal }: SignalPhotosProps) {
  const { addPhoto, removePhoto } = useSignals();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<SignalPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = signal.photos || [];
  const currentTotalSize = photos.reduce((sum, p) => sum + p.fileSize, 0);
  const storageUsedPercent = Math.round((currentTotalSize / MAX_TOTAL_PHOTOS_SIZE) * 100);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type as typeof ALLOWED_PHOTO_TYPES[number])) {
      return `File type "${file.type || 'unknown'}" is not supported. Allowed: JPEG, PNG, GIF, WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" (${formatFileSize(file.size)}) exceeds maximum of ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    if (currentTotalSize + file.size > MAX_TOTAL_PHOTOS_SIZE) {
      return `Adding "${file.name}" would exceed the ${formatFileSize(MAX_TOTAL_PHOTOS_SIZE)} storage limit.`;
    }
    if (photos.length >= MAX_PHOTOS) {
      return `Maximum of ${MAX_PHOTOS} photos allowed.`;
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

        addPhoto(signal.id, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: 'Current User',
          content: base64Content,
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
  }, [signal.id, currentTotalSize, photos.length]);

  const handleDelete = (photoId: string) => {
    removePhoto(signal.id, photoId);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4" />
            Foto's ({photos.length}/{MAX_PHOTOS})
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
            <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">
              Sleep foto's hierheen, of klik om te bladeren
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={ALLOWED_PHOTO_TYPES.join(',')}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS}
            >
              <Upload className="w-4 h-4 mr-2" />
              Foto's Toevoegen
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Max {formatFileSize(MAX_FILE_SIZE)} per foto
            </p>
          </div>

          {/* Storage Usage */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Opslag gebruikt</span>
              <span>
                {formatFileSize(currentTotalSize)} / {formatFileSize(MAX_TOTAL_PHOTOS_SIZE)}
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

          {/* Photos Grid */}
          {photos.length > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                  >
                    {photo.content ? (
                      <img
                        src={photo.content}
                        alt={photo.fileName}
                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => setPreviewPhoto(photo)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {photo.content && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewPhoto(photo)}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(photo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* File name tooltip */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{photo.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewPhoto?.content && (
            <div className="relative">
              <img
                src={previewPhoto.content}
                alt={previewPhoto.fileName}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white font-medium">{previewPhoto.fileName}</p>
                <p className="text-white/70 text-sm">
                  {formatFileSize(previewPhoto.fileSize)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
