export interface VisualizationData {
  id: string;
  name: string;
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
  createdAt: string;
}

export interface VisualizationNode {
  id: string;
  type: 'folder' | 'organization' | 'person' | 'address';
  label: string;
  position: { x: number; y: number };
}

export interface VisualizationEdge {
  id: string;
  source: string;
  target: string;
}
