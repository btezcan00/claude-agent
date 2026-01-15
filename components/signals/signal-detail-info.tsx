'use client';

import { Signal } from '@/types/signal';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  FileText,
  FolderOpen,
  User,
  Mail,
  Phone,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface SignalDetailInfoProps {
  signal: Signal;
}

export function SignalDetailInfo({ signal }: SignalDetailInfoProps) {
  const { getFolderById } = useFolders();

  const folders = signal.folderRelations
    .map((fr) => getFolderById(fr.folderId))
    .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Signal Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description Section */}
        <div>
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {signal.description}
          </p>
        </div>

        <Separator />

        {/* Location Section */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </h4>
          <div className="space-y-3 pl-6">
            <div>
              <p className="text-xs text-muted-foreground">Place of Observation</p>
              <p className="text-sm">{signal.placeOfObservation}</p>
            </div>
            {signal.locationDescription && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{signal.locationDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Person Section */}
        {signal.contactPerson && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Person
              </h4>
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {signal.contactPerson.firstName} {signal.contactPerson.lastName}
                  </span>
                </div>
                {signal.contactPerson.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`mailto:${signal.contactPerson.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {signal.contactPerson.email}
                    </a>
                  </div>
                )}
                {signal.contactPerson.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${signal.contactPerson.phoneNumber}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {signal.contactPerson.phoneNumber}
                    </a>
                  </div>
                )}
                {signal.contactPerson.wantsFeedback && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Wants to receive feedback</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Folders
              </h4>
              <div className="flex flex-wrap gap-2 pl-6">
                {folders.map((folder) => (
                  <Link key={folder!.id} href={`/folders/${folder!.id}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted gap-1.5"
                      style={{
                        borderColor: folder!.color || undefined,
                        color: folder!.color || undefined,
                      }}
                    >
                      {folder!.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: folder!.color }}
                        />
                      )}
                      {folder!.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
