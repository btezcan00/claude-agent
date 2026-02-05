'use client';

import { useSignals } from '@/context/signal-context';
import { Radio } from 'lucide-react';
import { SignalCard } from './signal-card';

export function SignalList() {
  const { filteredSignals } = useSignals();

  if (filteredSignals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Geen meldingen gevonden</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Probeer je zoek- of filtercriteria aan te passen om te vinden wat je
          zoekt.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredSignals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
