'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Signal } from '@/types/signal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, MapPin, User, ImageIcon, FileSearch, Trash2, Check, X } from 'lucide-react';

interface FolderSignalCardProps {
  signal: Signal;
  folderId: string;
  relation?: string;
  onRemove: (signalId: string) => void;
  onRelationChange: (signalId: string, relation: string) => void;
}

export function FolderSignalCard({ signal, folderId, relation, onRemove, onRelationChange }: FolderSignalCardProps) {
  const router = useRouter();
  const [showDescription, setShowDescription] = useState(false);
  const [showConsultMessage, setShowConsultMessage] = useState(false);
  const [isEditingRelation, setIsEditingRelation] = useState(false);
  const [relationText, setRelationText] = useState(relation || '');

  const firstPhoto = signal.photos?.[0];
  const hasPhoto = firstPhoto?.content;

  const handleCardClick = () => {
    if (!isEditingRelation) {
      router.push(`/signals/${signal.id}`);
    }
  };

  return (
    <>
      <Card
        className="overflow-hidden py-0 gap-0 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative h-40 bg-muted">
          {hasPhoto ? (
            <img
              src={firstPhoto.content}
              alt={signal.signalNumber}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          {/* 3-dot menu */}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowConsultMessage(true)}>
                  <FileSearch className="w-4 h-4 mr-2" />
                  Consult sources
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRemove(signal.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm font-medium line-clamp-2">{signal.placeOfObservation}</p>
          </div>

          {/* Reporter */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{signal.createdByName}</p>
          </div>

          {/* Relation field */}
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-medium text-muted-foreground">Relation</span>
            {isEditingRelation ? (
              <div className="space-y-2">
                <Textarea
                  value={relationText}
                  onChange={(e) => setRelationText(e.target.value)}
                  placeholder="Describe the relation between this signal and the folder..."
                  className="text-xs min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setRelationText(relation || '');
                      setIsEditingRelation(false);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary"
                    onClick={() => {
                      onRelationChange(signal.id, relationText);
                      setIsEditingRelation(false);
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 min-h-[32px] cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setIsEditingRelation(true)}
              >
                {relation || <span className="italic">Click to add relation...</span>}
              </div>
            )}
          </div>

          {/* View Description Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowDescription(true);
            }}
          >
            View description
          </Button>
        </div>
      </Card>

      {/* Description Dialog */}
      <Dialog open={showDescription} onOpenChange={setShowDescription}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{signal.signalNumber} - Description</DialogTitle>
            <DialogDescription>{signal.placeOfObservation}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm whitespace-pre-wrap">{signal.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consult Sources Message Dialog */}
      <Dialog open={showConsultMessage} onOpenChange={setShowConsultMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consult Sources</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Wait for the response.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
