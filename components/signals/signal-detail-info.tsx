'use client';

import { Signal } from '@/types/signal';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/lib/date-utils';
import {
  MapPin,
  Clock,
  FileText,
  FolderOpen,
  Building2,
  User,
  Mail,
  Phone,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { SIGNAL_SOURCE_CONFIG } from '@/lib/constants';

interface SignalDetailInfoProps {
  signal: Signal;
}

export function SignalDetailInfo({ signal }: SignalDetailInfoProps) {
  const { getFolderById } = useFolders();

  const folders = signal.folderIds
    .map((id) => getFolderById(id))
    .filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {signal.description}
            </p>
          </CardContent>
        </Card>

        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Place of Observation</p>
              <p className="text-sm text-muted-foreground">
                {signal.placeOfObservation}
              </p>
            </div>
            {signal.locationDescription && (
              <div>
                <p className="text-sm font-medium">Location Description</p>
                <p className="text-sm text-muted-foreground">
                  {signal.locationDescription}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        {signal.contactPerson && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  <span>Wants to receive feedback via email</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {folders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
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
            </CardContent>
          </Card>
        )}

        {signal.tags && signal.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {signal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        {/* Signal Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Signal Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={SIGNAL_SOURCE_CONFIG[signal.receivedBy].className}
            >
              {SIGNAL_SOURCE_CONFIG[signal.receivedBy].label}
            </Badge>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Time of Observation</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(signal.timeOfObservation)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(signal.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {signal.createdByName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(signal.updatedAt)}
                </p>
              </div>
            </div>

            {signal.closedAt && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Closed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(signal.closedAt)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
