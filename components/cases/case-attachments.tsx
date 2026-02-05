'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Case, CaseAttachment, CASE_ALLOWED_FILE_TYPES, CASE_MAX_FILE_SIZE } from '@/types/case';
import { SignalAttachment, SignalType } from '@/types/signal';
import { useCases } from '@/context/case-context';
import { useSignals } from '@/context/signal-context';
import { SIGNAL_TYPE_CONFIG } from '@/lib/constants';
import { currentUser } from '@/data/mock-users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatFileSize } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Paperclip,
  ChevronDown,
  ChevronRight,
  FileIcon,
  FileText,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { CaseAttachmentPreviewDialog } from './case-attachment-preview-dialog';

interface CaseAttachmentsProps {
  caseItem: Case;
}

const ITEMS_PER_PAGE = 10;

// Extended type for signal attachments with source info
interface SignalAttachmentWithSource extends SignalAttachment {
  signalNumber: string;
  signalTypes: SignalType[];
}

export function CaseAttachments({ caseItem }: CaseAttachmentsProps) {
  const { addFileAttachment, updateFileAttachment, removeFileAttachment } = useCases();
  const { getSignalsByCaseId } = useSignals();

  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<CaseAttachment | SignalAttachmentWithSource | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Signal subsection state
  const [isSignalCollapsed, setIsSignalCollapsed] = useState(false);
  const [signalCurrentPage, setSignalCurrentPage] = useState(1);

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');

  // Signal attachment filters
  const [signalNameFilter, setSignalNameFilter] = useState('');
  const [signalSourceFilter, setSignalSourceFilter] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = caseItem.fileAttachments || [];

  // Filter attachments
  const filteredAttachments = useMemo(() => {
    let result = [...attachments];

    if (nameFilter) {
      result = result.filter(a =>
        a.fileName.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (ownerFilter) {
      result = result.filter(a =>
        a.uploadedByName.toLowerCase().includes(ownerFilter.toLowerCase())
      );
    }
    if (tagsFilter) {
      result = result.filter(a =>
        a.tags.some(t => t.toLowerCase().includes(tagsFilter.toLowerCase()))
      );
    }

    // Sort by upload date descending
    result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return result;
  }, [attachments, nameFilter, ownerFilter, tagsFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAttachments.length / ITEMS_PER_PAGE);
  const paginatedAttachments = filteredAttachments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredAttachments.length);

  // Get signal attachments
  const signals = getSignalsByCaseId(caseItem.id);
  const signalAttachments = useMemo((): SignalAttachmentWithSource[] => {
    return signals.flatMap(signal =>
      signal.attachments.map(att => ({
        ...att,
        signalNumber: signal.signalNumber,
        signalTypes: signal.types,
      }))
    );
  }, [signals]);

  // Helper to format source text
  const formatSource = (att: SignalAttachmentWithSource) => {
    const typeLabels = att.signalTypes.map(t => SIGNAL_TYPE_CONFIG[t]?.label || t).join(', ');
    return `${att.signalNumber} - ${typeLabels}`;
  };

  // Filter signal attachments
  const filteredSignalAttachments = useMemo(() => {
    let result = [...signalAttachments];

    if (signalNameFilter) {
      result = result.filter(a =>
        a.fileName.toLowerCase().includes(signalNameFilter.toLowerCase())
      );
    }
    if (signalSourceFilter) {
      result = result.filter(a => {
        const source = formatSource(a).toLowerCase();
        return source.includes(signalSourceFilter.toLowerCase());
      });
    }

    // Sort by upload date descending
    result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return result;
  }, [signalAttachments, signalNameFilter, signalSourceFilter]);

  // Signal attachments pagination
  const signalTotalPages = Math.ceil(filteredSignalAttachments.length / ITEMS_PER_PAGE);
  const paginatedSignalAttachments = filteredSignalAttachments.slice(
    (signalCurrentPage - 1) * ITEMS_PER_PAGE,
    signalCurrentPage * ITEMS_PER_PAGE
  );
  const signalStartIndex = (signalCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const signalEndIndex = Math.min(signalCurrentPage * ITEMS_PER_PAGE, filteredSignalAttachments.length);

  // File validation
  const validateFile = (file: File): string | null => {
    if (!CASE_ALLOWED_FILE_TYPES.includes(file.type as typeof CASE_ALLOWED_FILE_TYPES[number])) {
      return `Bestandstype "${file.type || 'onbekend'}" wordt niet ondersteund.`;
    }
    if (file.size > CASE_MAX_FILE_SIZE) {
      return `Bestand "${file.name}" (${formatFileSize(file.size)}) overschrijdt maximum van ${formatFileSize(CASE_MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  // File reading
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // PDF text extraction
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
        fullText += `[Pagina ${i}]\n${pageText}\n\n`;
      }

      return fullText.substring(0, 50000);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  };

  // Text extraction
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

  // File upload handler
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

        await addFileAttachment(caseItem.id, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: currentUser.id,
          uploadedByName: `${currentUser.firstName} ${currentUser.lastName}`,
          description: '',
          tags: [],
          content: base64Content,
          textContent,
        });
      } catch {
        setUploadError(`Uploaden van "${file.name}" mislukt. Probeer het opnieuw.`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
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
  }, [caseItem.id]);

  // Download handler
  const handleDownload = (attachment: CaseAttachment | SignalAttachmentWithSource) => {
    if (!attachment.content) return;
    const link = document.createElement('a');
    link.href = attachment.content;
    link.download = attachment.fileName;
    link.click();
  };

  // Delete handler
  const handleDelete = async (attachmentId: string) => {
    await removeFileAttachment(caseItem.id, attachmentId);
  };

  // Inline editing handlers
  const startEditing = (attachment: CaseAttachment) => {
    setEditingId(attachment.id);
    setEditValue(attachment.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = async (attachmentId: string) => {
    await updateFileAttachment(caseItem.id, attachmentId, { description: editValue });
    setEditingId(null);
    setEditValue('');
  };

  // Filter component
  const FilterPopover = ({
    value,
    onChange,
    placeholder
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
          <Filter className={`h-3 w-3 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1"
            onClick={() => onChange('')}
          >
            Wissen
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CardTitle className="text-base flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <Paperclip className="w-4 h-4" />
            Bijlagen
            {attachments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {attachments.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-primary font-medium hover:underline">
                Bestand(en) toevoegen.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept={CASE_ALLOWED_FILE_TYPES.join(',')}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive flex-1">{uploadError}</p>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Attachments Table */}
            {attachments.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <div className="flex items-center">
                          Naam
                          <FilterPopover
                            value={nameFilter}
                            onChange={setNameFilter}
                            placeholder="Filteren op naam..."
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <div className="flex items-center">
                          Eigenaar
                          <FilterPopover
                            value={ownerFilter}
                            onChange={setOwnerFilter}
                            placeholder="Filteren op eigenaar..."
                          />
                        </div>
                      </TableHead>
                      <TableHead>Beschrijving</TableHead>
                      <TableHead className="w-[150px]">
                        <div className="flex items-center">
                          Labels
                          <FilterPopover
                            value={tagsFilter}
                            onChange={setTagsFilter}
                            placeholder="Filteren op label..."
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px]">Laatst bijgewerkt</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAttachments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Geen bijlagen voldoen aan uw filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAttachments.map((attachment) => (
                        <TableRow key={attachment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="truncate" title={attachment.fileName}>
                                {attachment.fileName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{attachment.uploadedByName}</TableCell>
                          <TableCell>
                            {editingId === attachment.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditing(attachment.id);
                                    if (e.key === 'Escape') cancelEditing();
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => saveEditing(attachment.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:text-primary"
                                onClick={() => startEditing(attachment)}
                              >
                                {attachment.description || (
                                  <span className="text-muted-foreground italic">
                                    Beschrijving invoeren
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {attachment.tags.length > 0 ? (
                                attachment.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatRelativeTime(attachment.uploadedAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setPreviewAttachment(attachment)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Bekijken
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Downloaden
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(attachment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Verwijderen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {filteredAttachments.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      {startIndex} - {endIndex} / {filteredAttachments.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Signal Attachments Subsection */}
            {signalAttachments.length > 0 && (
              <div className="border rounded-lg">
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => setIsSignalCollapsed(!isSignalCollapsed)}
                >
                  {isSignalCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Melding</span>
                  <Badge variant="secondary" className="ml-2">
                    {signalAttachments.length}
                  </Badge>
                </div>

                {!isSignalCollapsed && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">
                            <div className="flex items-center">
                              Naam
                              <FilterPopover
                                value={signalNameFilter}
                                onChange={setSignalNameFilter}
                                placeholder="Filteren op naam..."
                              />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              Bron
                              <FilterPopover
                                value={signalSourceFilter}
                                onChange={setSignalSourceFilter}
                                placeholder="Filteren op bron..."
                              />
                            </div>
                          </TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSignalAttachments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              Geen meldingsbijlagen voldoen aan uw filters
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSignalAttachments.map((attachment) => (
                            <TableRow key={attachment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span className="truncate" title={attachment.fileName}>
                                    {attachment.fileName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatSource(attachment)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setPreviewAttachment(attachment)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Bekijken
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Downloaden
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    {/* Signal Attachments Pagination */}
                    {filteredSignalAttachments.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <span className="text-sm text-muted-foreground">
                          {signalStartIndex} - {signalEndIndex} / {filteredSignalAttachments.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSignalCurrentPage(p => Math.max(1, p - 1))}
                            disabled={signalCurrentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {Array.from({ length: signalTotalPages }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              variant={signalCurrentPage === page ? 'default' : 'outline'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSignalCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSignalCurrentPage(p => Math.min(signalTotalPages, p + 1))}
                            disabled={signalCurrentPage === signalTotalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview Dialog */}
      <CaseAttachmentPreviewDialog
        attachment={previewAttachment}
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}
