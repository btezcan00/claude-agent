'use client';

import { Case } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatDateTime, isOverdue } from '@/lib/date-utils';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseDetailInfoProps {
  caseItem: Case;
}

export function CaseDetailInfo({ caseItem }: CaseDetailInfoProps) {
  const overdue = isOverdue(caseItem.dueDate) && caseItem.status !== 'closed';

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
              {caseItem.description}
            </p>
          </CardContent>
        </Card>

        {caseItem.tags && caseItem.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {caseItem.tags.map((tag) => (
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
        {/* Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Assigned To
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseItem.assigneeName ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {caseItem.assigneeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{caseItem.assigneeName}</p>
                  <p className="text-sm text-muted-foreground">Investigator</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Unassigned</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {caseItem.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {caseItem.location}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(caseItem.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {caseItem.createdByName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(caseItem.updatedAt)}
                </p>
              </div>
            </div>

            {caseItem.dueDate && (
              <>
                <Separator />
                <div
                  className={cn(
                    'flex items-start gap-3',
                    overdue && 'text-destructive'
                  )}
                >
                  {overdue ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                  ) : (
                    <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      Due Date {overdue && '(Overdue)'}
                    </p>
                    <p
                      className={cn(
                        'text-sm',
                        overdue ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {formatDate(caseItem.dueDate)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {caseItem.closedAt && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Closed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(caseItem.closedAt)}
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
