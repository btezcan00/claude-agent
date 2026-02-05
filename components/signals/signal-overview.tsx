'use client';

import { Signal } from '@/types/signal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/date-utils';
import { Building2, Clock, Calendar, RefreshCw } from 'lucide-react';
import { SIGNAL_SOURCE_CONFIG } from '@/lib/constants';

interface SignalOverviewProps {
  signal: Signal;
}

export function SignalOverview({ signal }: SignalOverviewProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Building2 className="w-3 h-3" />
              Bron
            </div>
            <Badge
              variant="outline"
              className={SIGNAL_SOURCE_CONFIG[signal.receivedBy].className}
            >
              {SIGNAL_SOURCE_CONFIG[signal.receivedBy].label}
            </Badge>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Waargenomen
            </div>
            <p className="text-sm font-medium">
              {formatDateTime(signal.timeOfObservation)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Aangemaakt
            </div>
            <p className="text-sm font-medium">
              {formatDateTime(signal.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              door {signal.createdByName}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <RefreshCw className="w-3 h-3" />
              Gewijzigd
            </div>
            <p className="text-sm font-medium">
              {formatDateTime(signal.updatedAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
