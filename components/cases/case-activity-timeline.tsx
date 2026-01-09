'use client';

import { Case, ActivityAction } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Activity,
  Plus,
  Edit,
  RefreshCw,
  UserPlus,
  UserMinus,
  MessageSquare,
  Paperclip,
  Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseActivityTimelineProps {
  caseItem: Case;
}

const actionIcons: Record<ActivityAction, React.ElementType> = {
  'case-created': Plus,
  'case-updated': Edit,
  'status-changed': RefreshCw,
  'priority-changed': RefreshCw,
  'assigned': UserPlus,
  'unassigned': UserMinus,
  'note-added': MessageSquare,
  'attachment-added': Paperclip,
  'attachment-removed': Trash,
};

const actionColors: Record<ActivityAction, string> = {
  'case-created': 'bg-green-100 text-green-600',
  'case-updated': 'bg-blue-100 text-blue-600',
  'status-changed': 'bg-yellow-100 text-yellow-600',
  'priority-changed': 'bg-orange-100 text-orange-600',
  'assigned': 'bg-purple-100 text-purple-600',
  'unassigned': 'bg-gray-100 text-gray-600',
  'note-added': 'bg-blue-100 text-blue-600',
  'attachment-added': 'bg-green-100 text-green-600',
  'attachment-removed': 'bg-red-100 text-red-600',
};

export function CaseActivityTimeline({ caseItem }: CaseActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activity ({caseItem.activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {caseItem.activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {caseItem.activities.map((activity) => {
                const Icon = actionIcons[activity.action];
                const colorClass = actionColors[activity.action];

                return (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        colorClass
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {activity.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {activity.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
