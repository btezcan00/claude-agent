'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSignals } from '@/context/signal-context';
import {
  CreateSignalInput,
  SignalType,
  SignalSource,
  ContactPerson,
  ALLOWED_PHOTO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  MAX_PHOTOS,
  MAX_ATTACHMENTS,
} from '@/types/signal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Camera, Paperclip, X, User } from 'lucide-react';
import { SIGNAL_TYPES, SIGNAL_SOURCES, SIGNAL_TYPE_CONFIG, SIGNAL_SOURCE_CONFIG } from '@/lib/constants';
import { cn, formatFileSize } from '@/lib/utils';

interface SignalCreateDialogProps {
  children?: React.ReactNode;
}

interface FilePreview {
  file: File;
  preview?: string;
}

export function SignalCreateDialog({ children }: SignalCreateDialogProps) {
  const router = useRouter();
  const { createSignal, addPhoto, addAttachment } = useSignals();
  const [open, setOpen] = useState(false);

  // Form state
  const [selectedTypes, setSelectedTypes] = useState<SignalType[]>([]);
  const [description, setDescription] = useState('');
  const [placeOfObservation, setPlaceOfObservation] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [timeOfObservation, setTimeOfObservation] = useState('');
  const [receivedBy, setReceivedBy] = useState<SignalSource>('police');

  // Contact person state
  const [addContactPerson, setAddContactPerson] = useState(false);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWantsFeedback, setContactWantsFeedback] = useState(false);

  // File state
  const [photos, setPhotos] = useState<FilePreview[]>([]);
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);


  const handleTypeToggle = (type: SignalType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return false;
      if (file.size > MAX_FILE_SIZE) return false;
      return true;
    });

    const remaining = MAX_PHOTOS - photos.length;
    const filesToAdd = validFiles.slice(0, remaining);

    const newPreviews: FilePreview[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPreviews]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) return false;
      if (file.size > MAX_FILE_SIZE) return false;
      return true;
    });

    const remaining = MAX_ATTACHMENTS - attachments.length;
    const filesToAdd = validFiles.slice(0, remaining);

    const newPreviews: FilePreview[] = filesToAdd.map((file) => ({
      file,
    }));

    setAttachments((prev) => [...prev, ...newPreviews]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const toRemove = prev[index];
      if (toRemove.preview) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedTypes([]);
    setDescription('');
    setPlaceOfObservation('');
    setLocationDescription('');
    setTimeOfObservation('');
    setReceivedBy('police');
    setAddContactPerson(false);
    setContactFirstName('');
    setContactLastName('');
    setContactEmail('');
    setContactPhone('');
    setContactWantsFeedback(false);
    photos.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTypes.length === 0 || !description.trim() || !placeOfObservation.trim() || !timeOfObservation) {
      return;
    }

    if (addContactPerson && (!contactFirstName.trim() || !contactLastName.trim())) {
      return;
    }

    let contactPerson: ContactPerson | undefined;
    if (addContactPerson) {
      contactPerson = {
        firstName: contactFirstName.trim(),
        lastName: contactLastName.trim(),
        email: contactEmail.trim() || undefined,
        phoneNumber: contactPhone.trim() || undefined,
        wantsFeedback: contactWantsFeedback,
      };
    }

    const signalData: CreateSignalInput = {
      types: selectedTypes,
      description: description.trim(),
      placeOfObservation: placeOfObservation.trim(),
      locationDescription: locationDescription.trim() || undefined,
      timeOfObservation: new Date(timeOfObservation).toISOString(),
      receivedBy,
      contactPerson,
    };

    const newSignal = await createSignal(signalData);

    // Upload photos
    for (const photoPreview of photos) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          await addPhoto(newSignal.id, {
            fileName: photoPreview.file.name,
            fileType: photoPreview.file.type,
            fileSize: photoPreview.file.size,
            uploadedBy: 'Current User',
            content: reader.result as string,
          });
          resolve();
        };
        reader.readAsDataURL(photoPreview.file);
      });
    }

    // Upload attachments
    for (const attachmentPreview of attachments) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          await addAttachment(newSignal.id, {
            fileName: attachmentPreview.file.name,
            fileType: attachmentPreview.file.type,
            fileSize: attachmentPreview.file.size,
            uploadedBy: 'Current User',
            content: reader.result as string,
          });
          resolve();
        };
        reader.readAsDataURL(attachmentPreview.file);
      });
    }

    setOpen(false);
    resetForm();
    router.push(`/signals/${newSignal.id}`);
  };

  const isFormValid =
    selectedTypes.length > 0 &&
    description.trim() &&
    placeOfObservation.trim() &&
    timeOfObservation &&
    (!addContactPerson || (contactFirstName.trim() && contactLastName.trim()));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Signal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Signal</DialogTitle>
          <DialogDescription>
            Enter the details for the new signal. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Signal Types - Multi-select */}
            <div className="grid gap-2">
              <Label>Signal Type(s) *</Label>
              <div className="flex flex-wrap gap-2">
                {SIGNAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeToggle(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                      selectedTypes.includes(type)
                        ? SIGNAL_TYPE_CONFIG[type].className + ' border-current'
                        : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                    )}
                  >
                    {SIGNAL_TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
              {selectedTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one signal type</p>
              )}
            </div>

            {/* Photos Upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos ({photos.length}/{MAX_PHOTOS})
              </Label>
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={photo.file.name}
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept={ALLOWED_PHOTO_TYPES.join(',')}
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Max {MAX_PHOTOS} photos, 1MB each. Supported: JPEG, PNG, GIF, WebP</p>
            </div>

            {/* Attachments Upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({attachments.length}/{MAX_ATTACHMENTS})
              </Label>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{attachment.file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(attachment.file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {attachments.length < MAX_ATTACHMENTS && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attachment
                  </Button>
                )}
              </div>
              <input
                ref={attachmentInputRef}
                type="file"
                accept={ALLOWED_DOCUMENT_TYPES.join(',')}
                multiple
                onChange={handleAttachmentSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Max {MAX_ATTACHMENTS} documents, 1MB each. Supported: PDF, Word, Excel, Text, CSV</p>
            </div>

            {/* Place of Observation */}
            <div className="grid gap-2">
              <Label htmlFor="placeOfObservation">Place of Observation (Address) *</Label>
              <Input
                id="placeOfObservation"
                placeholder="Enter the address where the observation was made"
                value={placeOfObservation}
                onChange={(e) => setPlaceOfObservation(e.target.value)}
                required
              />
            </div>

            {/* Location Description */}
            <div className="grid gap-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Textarea
                id="locationDescription"
                placeholder="Additional details about the location (landmarks, building description, etc.)"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Time of Observation */}
            <div className="grid gap-2">
              <Label htmlFor="timeOfObservation">Time of Observation *</Label>
              <Input
                id="timeOfObservation"
                type="datetime-local"
                value={timeOfObservation}
                onChange={(e) => setTimeOfObservation(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what was observed in detail"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Received By */}
            <div className="grid gap-2">
              <Label htmlFor="receivedBy">Signal Received By *</Label>
              <Select
                value={receivedBy}
                onValueChange={(value: SignalSource) => setReceivedBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {SIGNAL_SOURCE_CONFIG[source].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-contact" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Add Contact Person
                </Label>
                <Switch
                  id="add-contact"
                  checked={addContactPerson}
                  onCheckedChange={setAddContactPerson}
                />
              </div>

              {addContactPerson && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactFirstName">First Name *</Label>
                      <Input
                        id="contactFirstName"
                        value={contactFirstName}
                        onChange={(e) => setContactFirstName(e.target.value)}
                        placeholder="First name"
                        required={addContactPerson}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactLastName">Last Name *</Label>
                      <Input
                        id="contactLastName"
                        value={contactLastName}
                        onChange={(e) => setContactLastName(e.target.value)}
                        placeholder="Last name"
                        required={addContactPerson}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wantsFeedback"
                      checked={contactWantsFeedback}
                      onCheckedChange={(checked) => setContactWantsFeedback(checked === true)}
                    />
                    <Label htmlFor="wantsFeedback" className="text-sm cursor-pointer">
                      Contact person wants to receive feedback via email
                    </Label>
                  </div>
                </div>
              )}
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Create Signal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
