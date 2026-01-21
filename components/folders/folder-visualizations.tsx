'use client';

import { useState } from 'react';
import { Folder, FolderItem } from '@/types/folder';
import { useFolders } from '@/context/folder-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, X } from 'lucide-react';
import { VisualizationWizardDialog } from './visualization-wizard-dialog';
import { VisualizationNode, VisualizationEdge } from '@/types/visualization';
import { VisualizationPreview } from './visualization-preview';

interface FolderVisualizationsProps {
  folder: Folder;
}

interface ParsedVisualization {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}

function parseVisualizationData(description: string): ParsedVisualization | null {
  try {
    const data = JSON.parse(description);
    if (data.nodes && data.edges) {
      return data as ParsedVisualization;
    }
    return null;
  } catch {
    return null;
  }
}

export function FolderVisualizations({ folder }: FolderVisualizationsProps) {
  const { addVisualization, removeVisualization } = useFolders();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = async (visualization: {
    name: string;
    nodes: VisualizationNode[];
    edges: VisualizationEdge[];
  }) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Store visualization data as JSON in the description field
    const visualizationData = JSON.stringify({
      nodes: visualization.nodes,
      edges: visualization.edges,
    });

    const item: Omit<FolderItem, 'id'> = {
      date: formattedDate,
      phase: folder.status,
      label: visualization.name,
      description: visualizationData,
    };

    await addVisualization(folder.id, item);
  };

  const handleRemove = async (itemId: string) => {
    await removeVisualization(folder.id, itemId);
  };

  const visualizations = folder.visualizations || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualizations
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visualizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No visualizations added
            </p>
          ) : (
            <div className="space-y-3">
              {visualizations.map((item) => {
                const vizData = parseVisualizationData(item.description);
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg overflow-hidden hover:border-primary/50 cursor-pointer"
                  >
                    {/* Graph Preview */}
                    {vizData && (
                      <div className="h-[150px] bg-gray-50 border-b">
                        <VisualizationPreview
                          nodes={vizData.nodes}
                          edges={vizData.edges}
                        />
                      </div>
                    )}

                    {/* Info Footer */}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{item.label}</span>
                        <p className="text-xs text-muted-foreground">
                          {item.date}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <VisualizationWizardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        folder={folder}
        onSave={handleSave}
      />
    </>
  );
}
