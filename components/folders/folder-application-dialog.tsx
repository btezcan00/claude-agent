'use client';

import { useState, useEffect } from 'react';
import { Folder, APPLICATION_CRITERIA, ApplicationCriterion } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderApplicationDialogProps {
  folder: Folder;
  open: boolean;
  onClose: () => void;
  onStartResearch: () => void;
}

export function FolderApplicationDialog({
  folder,
  open,
  onClose,
  onStartResearch,
}: FolderApplicationDialogProps) {
  const { updateApplicationData, completeApplication } = useFolders();

  const [explanation, setExplanation] = useState(folder.applicationData?.explanation || '');
  const [criteria, setCriteria] = useState<ApplicationCriterion[]>(
    folder.applicationData?.criteria || APPLICATION_CRITERIA.map((c) => ({
      id: c.id,
      name: c.name,
      label: c.label,
      isMet: false,
      explanation: '',
    }))
  );

  // Reset form when folder changes
  useEffect(() => {
    setExplanation(folder.applicationData?.explanation || '');
    setCriteria(
      folder.applicationData?.criteria || APPLICATION_CRITERIA.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.label,
        isMet: false,
        explanation: '',
      }))
    );
  }, [folder.id, folder.applicationData]);

  const handleCriterionToggle = (criterionId: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId ? { ...c, isMet: !c.isMet } : c
      )
    );
  };

  const handleCriterionExplanation = (criterionId: string, value: string) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId ? { ...c, explanation: value } : c
      )
    );
  };

  const handleSave = () => {
    updateApplicationData(folder.id, {
      explanation,
      criteria,
    });
    onClose();
  };

  const handleStartResearch = () => {
    // Save the data first
    updateApplicationData(folder.id, {
      explanation,
      criteria,
    });
    // Then complete the application and move to research
    completeApplication(folder.id);
    onStartResearch();
  };

  // Check if all criteria are met and have explanations
  const allCriteriaMet = criteria.every((c) => c.isMet && c.explanation.trim());
  const canStartResearch = explanation.trim() && allCriteriaMet;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completion of Bibob Test Application</DialogTitle>
          <DialogDescription>
            Complete the application checklist for: {folder.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide an overall explanation for this application..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Criteria */}
          <div className="space-y-4">
            <h3 className="font-medium">Application Criteria</h3>
            <p className="text-sm text-muted-foreground">
              For each criterion, indicate if it is met and provide an explanation.
            </p>

            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className={cn(
                  'p-4 border rounded-lg space-y-3',
                  criterion.isMet && criterion.explanation.trim()
                    ? 'border-green-200 bg-green-50'
                    : 'border-muted'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {criterion.isMet ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{criterion.label}</span>
                  </div>
                  <Button
                    variant={criterion.isMet ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCriterionToggle(criterion.id)}
                  >
                    {criterion.isMet ? 'Criterion Met' : 'Is the criterion met?'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`explanation-${criterion.id}`} className="text-sm">
                    Explanation for criterion: {criterion.label}
                  </Label>
                  <Textarea
                    id={`explanation-${criterion.id}`}
                    value={criterion.explanation}
                    onChange={(e) => handleCriterionExplanation(criterion.id, e.target.value)}
                    placeholder={`Provide explanation for "${criterion.label}"...`}
                    rows={2}
                    className="text-sm"
                  />
                  {criterion.isMet && !criterion.explanation.trim() && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Explanation required when criterion is met
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Criteria completed:</span>
              <span className="font-medium">
                {criteria.filter((c) => c.isMet && c.explanation.trim()).length} / {criteria.length}
              </span>
            </div>
            <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(criteria.filter((c) => c.isMet && c.explanation.trim()).length / criteria.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSave}>
            Save and Close
          </Button>
          <Button
            onClick={handleStartResearch}
            disabled={!canStartResearch}
          >
            Start Own Research
          </Button>
        </DialogFooter>

        {!canStartResearch && (
          <p className="text-xs text-muted-foreground text-center">
            Complete all criteria with explanations to start research
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
