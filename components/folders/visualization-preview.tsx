'use client';

import { useMemo } from 'react';
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
import { VisualizationNode, VisualizationEdge } from '@/types/visualization';

interface VisualizationPreviewProps {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}

// Custom node component for the folder (root)
function FolderNode({ data }: NodeProps) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 shadow-md min-w-[100px] text-center">
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center justify-center gap-1">
        <Folder className="w-3 h-3 text-blue-600" />
        <span className="font-medium text-xs">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for organizations
function OrganizationNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm min-w-[80px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center justify-center gap-1">
        <Building2 className="w-3 h-3 text-purple-600" />
        <span className="text-xs">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for people
function PersonNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm min-w-[80px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center justify-center gap-1">
        <User className="w-3 h-3 text-green-600" />
        <span className="text-xs">{data.label as string}</span>
      </div>
    </div>
  );
}

// Custom node component for addresses
function AddressNode({ data }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm min-w-[80px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3 text-red-600" />
        <span className="text-xs">{data.label as string}</span>
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

export function VisualizationPreview({ nodes, edges }: VisualizationPreviewProps) {
  const flowNodes: Node[] = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { label: node.label },
      })),
    [nodes]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })),
    [edges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background gap={15} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
