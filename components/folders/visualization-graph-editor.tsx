'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Folder, Building2, User, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Folder as FolderType } from '@/types/folder';
import { VisualizationNode, VisualizationEdge } from '@/types/visualization';

interface VisualizationGraphEditorProps {
  folder: FolderType;
  onSave: (name: string, nodes: VisualizationNode[], edges: VisualizationEdge[]) => void;
  onCancel: () => void;
}

// Custom node component for the folder (root)
function FolderNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-3 shadow-md min-w-[150px] text-center">
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <div className="flex items-center justify-center gap-2">
        <Folder className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-sm">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for organizations
function OrganizationNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm min-w-[120px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center justify-center gap-2">
        <Building2 className="w-4 h-4 text-purple-600" />
        <span className="text-sm">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for people
function PersonNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm min-w-[120px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center justify-center gap-2">
        <User className="w-4 h-4 text-green-600" />
        <span className="text-sm">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for addresses
function AddressNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm min-w-[120px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center justify-center gap-2">
        <MapPin className="w-4 h-4 text-red-600" />
        <span className="text-sm">{data.label as string}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  folder: FolderNode,
  organization: OrganizationNode,
  person: PersonNode,
  address: AddressNode,
};

export function VisualizationGraphEditor({
  folder,
  onSave,
  onCancel,
}: VisualizationGraphEditorProps) {
  const [name, setName] = useState(`${folder.name} - Visualization`);

  // Generate initial nodes and edges based on folder data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root node (folder)
    nodes.push({
      id: 'folder',
      type: 'folder',
      position: { x: 300, y: 50 },
      data: { label: folder.name },
    });

    // Calculate positions for leaf nodes
    const organizations = folder.organizations || [];
    const people = folder.peopleInvolved || [];
    const addresses = folder.addresses || [];

    const allLeaves = [
      ...organizations.map((org) => ({ id: `org-${org.id}`, type: 'organization', label: org.name })),
      ...people.map((person) => ({ id: `person-${person.id}`, type: 'person', label: `${person.firstName} ${person.surname}` })),
      ...addresses.map((addr) => ({ id: `addr-${addr.id}`, type: 'address', label: addr.street })),
    ];

    const totalLeaves = allLeaves.length;
    const startX = 300 - ((totalLeaves - 1) * 100);

    allLeaves.forEach((leaf, index) => {
      const x = startX + index * 200;
      nodes.push({
        id: leaf.id,
        type: leaf.type,
        position: { x, y: 200 },
        data: { label: leaf.label },
      });

      edges.push({
        id: `edge-${leaf.id}`,
        source: 'folder',
        target: leaf.id,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    });


    return { initialNodes: nodes, initialEdges: edges };
  }, [folder]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);

  const handleSave = useCallback(() => {
    const visualizationNodes: VisualizationNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type as VisualizationNode['type'],
      label: node.data.label as string,
      position: node.position,
    }));

    const visualizationEdges: VisualizationEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    onSave(name, visualizationNodes, visualizationEdges);
  }, [name, nodes, edges, onSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="space-y-2">
          <Label htmlFor="visualization-name">Name</Label>
          <Input
            id="visualization-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter visualization name"
          />
        </div>
      </div>

      <div className="bg-gray-50 h-[400px] w-full">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={() => {}}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.5}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div className="px-4 py-3 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
}
