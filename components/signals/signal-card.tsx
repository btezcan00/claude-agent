'use client';

import Link from 'next/link';
import { Signal } from '@/types/signal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SignalTypeBadge } from './signal-type-badge';
import { formatRelativeTime, formatDateTime } from '@/lib/date-utils';
import { MapPin, Clock, Briefcase, Building2 } from 'lucide-react';
import { useCases } from '@/context/case-context';
import { Badge } from '@/components/ui/badge';
import { SIGNAL_SOURCE_CONFIG } from '@/lib/constants';

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const { getCaseById } = useCases();

  const cases = signal.caseRelations
    .map((cr) => getCaseById(cr.caseId))
    .filter(Boolean);

  return (
    <Link href={`/signals/${signal.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground">
                {signal.signalNumber}
              </p>
              <Badge variant="outline" className="text-xs">
                {signal.receivedBy && SIGNAL_SOURCE_CONFIG[signal.receivedBy]?.label || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(signal.types || []).map((type) => (
              <SignalTypeBadge key={type} type={type} />
            ))}
          </div>

          {cases.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {cases.slice(0, 2).map((caseItem) => (
                <Badge
                  key={caseItem!.id}
                  variant="outline"
                  className="text-xs gap-1"
                  style={{
                    borderColor: caseItem!.color || undefined,
                    color: caseItem!.color || undefined,
                  }}
                >
                  <Briefcase className="w-3 h-3" />
                  {caseItem!.name}
                </Badge>
              ))}
              {cases.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{cases.length - 2}
                </Badge>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2">
            {signal.description}
          </p>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{signal.placeOfObservation}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Observed: {formatDateTime(signal.timeOfObservation)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{signal.createdByName}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(signal.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
