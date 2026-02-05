'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Case } from '@/types/case';
import { VisualizationNode, VisualizationEdge } from '@/types/visualization';
import { VisualizationGraphEditor } from './visualization-graph-editor';

interface VisualizationWizardDialogProps {
  open: boolean;
  onClose: () => void;
  caseItem: Case;
  onSave: (visualization: {
    name: string;
    nodes: VisualizationNode[];
    edges: VisualizationEdge[];
  }) => void;
}

type WizardStep = 'import' | 'editor';

interface StepInfo {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
}

export function VisualizationWizardDialog({
  open,
  onClose,
  caseItem,
  onSave,
}: VisualizationWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>('import');

  const handleSkip = useCallback(() => {
    setStep('editor');
  }, []);

  const handleSave = useCallback(
    (name: string, nodes: VisualizationNode[], edges: VisualizationEdge[]) => {
      onSave({ name, nodes, edges });
      setStep('import'); // Reset for next time
      onClose();
    },
    [onSave, onClose]
  );

  const handleCancel = useCallback(() => {
    setStep('import'); // Reset for next time
    onClose();
  }, [onClose]);

  // Reset step when dialog closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep('import');
        onClose();
      }
    },
    [onClose]
  );

  const steps: StepInfo[] = [
    { id: 'case', label: 'Dossier', status: 'completed' },
    { id: 'upload', label: 'Uploaden', status: step === 'import' ? 'current' : 'completed' },
    { id: 'control', label: 'Controle', status: 'pending' },
    { id: 'correction', label: 'Correctie', status: 'pending' },
    { id: 'import', label: 'Importeren', status: step === 'editor' ? 'current' : 'pending' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-3xl p-0 gap-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Visualisatie maken</DialogTitle>
        {/* Stepper Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                      s.status === 'completed'
                        ? 'bg-green-600 border-green-600 text-white'
                        : s.status === 'current'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {s.status === 'completed' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      s.status === 'current'
                        ? 'text-blue-600'
                        : s.status === 'completed'
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      steps[index + 1].status !== 'pending' || s.status === 'completed'
                        ? 'bg-green-300'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        {step === 'import' ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold">
                Wilt u entiteiten importeren voor &quot;{caseItem.name}&quot;?
              </h2>
              <p className="text-muted-foreground">
                Importeer organisaties, personen en adressen uit externe bronnen,
                of sla over om een visualisatie te maken met bestaande dossier-entiteiten.
              </p>
              <div className="flex items-center justify-center">
                <Button onClick={handleSkip}>
                  Overslaan
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <VisualizationGraphEditor
            caseItem={caseItem}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
