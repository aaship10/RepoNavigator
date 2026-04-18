import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { mockGraphNodes, mockGraphEdges } from '../../data/mockData';

const heatColors = {
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#9CA3AF',
  hollow: '#64748B',
  blue: '#60A5FA',
};

// Custom neumorphic node component
function CustomNode({ data, selected }) {
  const isOrphaned = data.orphaned;
  const heatColor = heatColors[data.heat] || '#9CA3AF';

  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="px-5 py-3.5 rounded-2xl min-w-[140px] transition-all duration-300"
        style={{
          background: isOrphaned ? 'rgba(35, 41, 57, 0.5)' : '#232939',
          boxShadow: selected
            ? `inset 3px 3px 8px #141820, inset -3px -3px 8px #283048, 0 0 20px ${heatColor}33`
            : `4px 4px 10px #141820, -4px -4px 10px #283048`,
          border: isOrphaned ? '1.5px dashed #64748B' : '1px solid rgba(255,255,255,0.03)',
          opacity: isOrphaned ? 0.55 : 1,
        }}
      >
        {/* Heat indicator */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: isOrphaned ? 'transparent' : heatColor,
              border: isOrphaned ? `1.5px dashed ${heatColor}` : 'none',
              boxShadow: isOrphaned ? 'none' : `0 0 8px ${heatColor}55`,
            }}
          />
          <span className="text-sm font-semibold text-text-primary truncate">
            {data.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span>{data.type}</span>
          <span className="opacity-40">•</span>
          <span>↓{data.deps}</span>
          <span>↑{data.usedBy}</span>
        </div>

        {/* Selected glow ring */}
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: `1.5px solid ${heatColor}44`,
              boxShadow: `0 0 15px ${heatColor}22`,
            }}
            layoutId="selectedNodeRing"
          />
        )}
      </div>

      {/* Orphan badge */}
      {isOrphaned && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{
            background: '#232939',
            color: '#F87171',
            boxShadow: '2px 2px 6px #141820, -2px -2px 6px #283048',
          }}
        >
          DEAD
        </div>
      )}
    </motion.div>
  );
}

const nodeTypes = { custom: CustomNode };

// Process edges to add curve styling
function processEdges(edges) {
  return edges.map(edge => ({
    ...edge,
    type: 'default',
    animated: edge.animated || false,
    style: {
      ...edge.style,
      strokeWidth: 1.5,
      opacity: 0.6,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.style?.stroke || '#6366F1',
      width: 15,
      height: 15,
    },
  }));
}

export default function DependencyGraph({ onNodeClick, selectedNode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    mockGraphNodes.map(n => ({
      ...n,
      selected: n.id === selectedNode,
    }))
  );

  const processedEdges = useMemo(() => processEdges(mockGraphEdges), []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);

  const handleNodeClick = useCallback((event, node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: '#1E232E',
        boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #283048',
      }}
    >
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, selected: n.id === selectedNode }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
          style: { strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant="dots"
          gap={24}
          size={1}
          color="rgba(99,102,241,0.08)"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          style={{ marginBottom: 16, marginLeft: 16 }}
        />
        <MiniMap
          nodeColor={(node) => heatColors[node.data?.heat] || '#9CA3AF'}
          nodeStrokeColor="#283048"
          nodeBorderRadius={8}
          maskColor="rgba(99,102,241,0.1)"
          style={{
            bottom: 16,
            right: 16,
            width: 160,
            height: 100,
          }}
        />
      </ReactFlow>
    </div>
  );
}
