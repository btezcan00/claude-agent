'use client';

import { Signal, ActivityAction } from '@/types/signal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/date-utils';
import {
  Activity,
  Plus,
  Edit,
  MessageSquare,
  Image,
  Paperclip,
  Trash,
  FolderPlus,
  FolderMinus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalActivityTimelineProps {
  signal: Signal;
}

const actionIcons: Record<ActivityAction, React.ElementType> = {
  'signal-created': Plus,
  'signal-updated': Edit,
  'assigned': Activity,
  'unassigned': Activity,
  'note-added': MessageSquare,
  'photo-added': Image,
  'photo-removed': Trash,
  'attachment-added': Paperclip,
  'attachment-removed': Trash,
  'case-added': FolderPlus,
  'case-removed': FolderMinus,
};

const actionColors: Record<ActivityAction, string> = {
  'signal-created': 'bg-green-100 text-green-600',
  'signal-updated': 'bg-blue-100 text-blue-600',
  'assigned': 'bg-purple-100 text-purple-600',
  'unassigned': 'bg-gray-100 text-gray-600',
  'note-added': 'bg-blue-100 text-blue-600',
  'photo-added': 'bg-green-100 text-green-600',
  'photo-removed': 'bg-red-100 text-red-600',
  'attachment-added': 'bg-green-100 text-green-600',
  'attachment-removed': 'bg-red-100 text-red-600',
  'case-added': 'bg-indigo-100 text-indigo-600',
  'case-removed': 'bg-gray-100 text-gray-600',
};

export function SignalActivityTimeline({ signal }: SignalActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Activity ({signal.activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signal.activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {signal.activities.map((activity) => {
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
