import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const categoryColors = {
  folder: '#A855F7',     // Purple
  ui: '#60A5FA',         // Blue
  math: '#FB923C',       // Orange
  core: '#FB923C',       // Orange
  algorithm: '#A855F7',  // Purple
  visualizer: '#2DD4BF', // Teal
  general: '#94A3B8',    // Slate
};

const heatColors = {
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#9CA3AF',
  hollow: '#64748B',
  blue: '#60A5FA',
};

/**
 * Custom Node Component: Rich Data Card (Horizontal Flow)
 */
function CustomNode({ data, selected }) {
  const isFolder = data.type === 'folder';
  const accentColor = isFolder ? categoryColors.folder : (categoryColors[data.category?.toLowerCase()] || categoryColors.general);
  const heatColor = heatColors[data.heat] || '#9CA3AF';
  const isExpanded = data.isExpanded;

  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Horizontal Handles for Left-To-Right Tree Flow */}
      <Handle type="target" position={Position.Left} style={{ background: accentColor, width: 8, height: 8, border: 'none', left: -4 }} />
      <Handle type="source" position={Position.Right} style={{ background: accentColor, width: 8, height: 8, border: 'none', right: -4 }} />

      <div
        className="w-[240px] px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden"
        style={{
          background: '#1E232E',
          boxShadow: selected
            ? 'inset 4px 4px 10px #141820, inset -4px -4px 10px #283048'
            : '8px 8px 16px #141820, -8px -8px 16px #283048',
          border: selected ? `1px solid ${accentColor}44` : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Top-Right Category Accent Triangle */}
        <div
          className="absolute top-0 right-0 w-10 h-10 pointer-events-none"
          style={{
            background: accentColor,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            opacity: 0.8,
          }}
        />

        {/* Expansion Indicator for Folders */}
        {isFolder && (
          <div className="absolute top-1.5 right-1.5 z-10 text-white/80">
            {isExpanded ? <Minus size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
          </div>
        )}

        {/* Content Stack */}
        <div className="flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: heatColor, boxShadow: `0 0 8px ${heatColor}88` }}
            />
            <span className="text-[10px] font-mono text-gray-400 truncate max-w-[180px]">
              {data.label}
            </span>
          </div>

          <h3 className="text-sm font-medium text-gray-100 mt-1 leading-tight truncate">
            {data.description || (isFolder ? 'Directory' : 'File')}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-medium">
            <span className="opacity-50 uppercase tracking-tighter">
              {isFolder ? 'Folder' : (data.category || 'File')}
            </span>
            {isFolder && data.childCount > 0 && (
              <span className="ml-auto text-indigo-400">
                {data.childCount} Items
              </span>
            )}
          </div>
        </div>

        {/* Selected Highlight Overlay */}
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: `0 0 20px ${accentColor}11` }}
            layoutId="selectedNodeGlow"
          />
        )}
      </div>
    </motion.div>
  );
}

const nodeTypes = { custom: CustomNode };

/**
 * Utility: Flat Array ["src/App.js"] -> Nested Tree Objects
 */
function buildTreeFromPaths(paths) {
  if (!paths || !Array.isArray(paths) || paths.length === 0) return [];
  
  const root = [];
  paths.forEach(path => {
    const parts = path.split('/').filter(Boolean); // Clean any empty parts
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const id = parts.slice(0, index + 1).join('/');
      let existingNode = currentLevel.find(node => node.id === id);

      if (existingNode) {
        currentLevel = existingNode.children;
      } else {
        const newNode = {
          id: id,
          name: part,
          type: isFile ? 'file' : 'folder',
          icon: isFile ? part.split('.').pop() : 'folder',
          heat: 'blue', 
          children: []
        };
        currentLevel.push(newNode);
        currentLevel = newNode.children;
      }
    });
  });
  return root;
}

/**
 * Layout Logic (Horizontal: Left to Right)
 */
const getTreeLayout = (tree, expandedIds) => {
  const nodes = [];
  const edges = [];
  const nodeWidth = 320; // Horizontal gap between layers
  const nodeHeight = 110; // Vertical gap between siblings

  // Calculate vertical height required for a subtree
  const getSubtreeHeight = (item) => {
    if (!expandedIds.has(item.id) || !item.children || item.children.length === 0) {
      return nodeHeight;
    }
    return item.children.reduce((acc, child) => acc + getSubtreeHeight(child), 0);
  };

  const processNode = (item, parentId, depth, yOffset) => {
    const isExpanded = expandedIds.has(item.id);
    const subtreeHeight = getSubtreeHeight(item);

    // X is based on depth, Y is centered within its required subtree height
    const x = depth * nodeWidth;
    const y = yOffset + subtreeHeight / 2 - nodeHeight / 2;

    nodes.push({
      id: item.id,
      type: 'custom',
      position: { x, y },
      data: {
        label: item.id,
        type: item.type,
        category: item.type === 'folder' ? 'Folder' : item.icon,
        heat: item.heat || 'grey',
        description: item.name,
        isExpanded,
        childCount: item.children?.length || 0,
      },
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${item.id}`,
        source: parentId,
        target: item.id,
        style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2 },
        type: 'smoothstep', 
      });
    }

    if (isExpanded && item.children) {
      let currentY = yOffset;
      item.children.forEach(child => {
        processNode(child, item.id, depth + 1, currentY);
        currentY += getSubtreeHeight(child);
      });
    }
  };

  let rootYOffset = 0;
  tree.forEach(root => {
    processNode(root, null, 0, rootYOffset);
    rootYOffset += getSubtreeHeight(root);
  });

  return { nodes, edges };
};

export default function DependencyGraph({ onNodeClick, selectedNode, files = [] }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Auto-expand the root level when files first load
  useEffect(() => {
    if (files.length > 0 && expandedIds.size === 0) {
      const tree = buildTreeFromPaths(files);
      const roots = new Set();
      tree.forEach(node => roots.add(node.id));
      setExpandedIds(roots);
    }
  }, [files]); // Intentionally omitting expandedIds to only run once per repo

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const tree = buildTreeFromPaths(files);
    return getTreeLayout(tree, expandedIds);
  }, [files, expandedIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync state when layout recalculates
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    const clickedId = node.id;
    const item = nodes.find(n => n.id === clickedId);

    if (item?.data.type === 'folder') {
      setExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(clickedId)) {
          // Collapse
          next.delete(clickedId);
        } else {
          // Expand + Accordion Logic: Collapse siblings
          const parentPath = clickedId.substring(0, clickedId.lastIndexOf('/')) || 'root';
          prev.forEach(id => {
            const siblingParentPath = id.substring(0, id.lastIndexOf('/')) || 'root';
            // If it shares a parent and is at the same depth, close it
            if (siblingParentPath === parentPath && id !== clickedId && id.split('/').length === clickedId.split('/').length) {
              next.delete(id);
            }
          });
          next.add(clickedId);
        }
        return next;
      });
    }

    if (onNodeClick) onNodeClick(clickedId);
  }, [nodes, onNodeClick]);

  // Safety fallback while waiting for API data
  if (!files || files.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-sm" style={{ background: '#1E232E' }}>
        Awaiting repository data...
      </div>
    );
  }

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
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={32} size={1} color="rgba(255,255,255,0.05)" />
        <Controls showInteractive={false} position="bottom-left" style={{ marginBottom: 20, marginLeft: 20 }} />
      </ReactFlow>
    </div>
  );
}