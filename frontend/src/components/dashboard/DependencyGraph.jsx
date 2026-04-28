import { useCallback, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GitBranch, Unlink, Grid3X3, Network, ChevronRight, History, FileText } from 'lucide-react';
import TimeMachineContainer from './TimeMachineOverlays';

// ─── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#60A5FA', '#F87171', '#A855F7', '#2DD4BF',
  '#FBBF24', '#FB923C', '#4ADE80', '#E879F9',
];
function folderColor(name, allFolders) {
  const idx = allFolders.indexOf(name);
  return PALETTE[Math.max(0, idx) % PALETTE.length];
}

// ─── Mock data (used when no real apiData yet) ─────────────────────────────────
const MOCK_EDGES = [
  ['api/routes.js',   'core/utils.js'],
  ['api/routes.js',   'core/config.js'],
  ['api/auth.js',     'auth/jwt.js'],
  ['api/auth.js',     'db/users.js'],
  ['ui/Dashboard.jsx','api/routes.js'],
  ['ui/Profile.jsx',  'api/auth.js'],
  ['ui/Profile.jsx',  'core/utils.js'],
  ['core/utils.js',   'db/conn.js'],
  ['auth/jwt.js',     'core/config.js'],
  ['auth/oauth.js',   'db/sessions.js'],
];
const MOCK_FILE_TREE = [...new Set(MOCK_EDGES.flatMap(([s,t])=>[s,t]))];

// ─── Utilities ────────────────────────────────────────────────────────────────
function topFolder(filePath) {
  const parts = filePath.split('/');
  return parts.length > 1 ? parts[0] : '__root__';
}

/** Get the sub-path relative to a prefix folder */
function relPath(filePath, prefix) {
  if (!prefix || prefix === '') return filePath;
  if (filePath.startsWith(prefix + '/')) return filePath.slice(prefix.length + 1);
  return filePath;
}

/** Get all files that live under a given folder prefix */
function filesUnder(folder, fileTree) {
  if (!folder || folder === '') return fileTree;
  return fileTree.filter(f => f.startsWith(folder + '/'));
}

/** Get the immediate sub-folders under a prefix */
function getSubFolders(prefix, fileTree) {
  const files = filesUnder(prefix, fileTree);
  const subs = new Set();
  files.forEach(f => {
    const rel = relPath(f, prefix);
    const first = rel.split('/')[0];
    // Only count as sub-folder if the file isn't directly in this folder
    if (rel.includes('/')) subs.add(first);
  });
  return [...subs];
}

/** Get direct files (not inside a sub-folder) in a prefix */
function getDirectFiles(prefix, fileTree) {
  const files = filesUnder(prefix, fileTree);
  return files.filter(f => {
    const rel = relPath(f, prefix);
    return !rel.includes('/');
  });
}

function buildMatrixData(subFolders, prefix, edges, fileTree) {
  const map = {};
  // Include (root) bucket for files directly in this folder + all subfolders
  const allBuckets = ['(root)', ...subFolders];
  allBuckets.forEach(f => { 
    map[f] = {}; 
    allBuckets.forEach(t => { map[f][t] = 0; }); 
  });

  // Helper: which bucket does a file belong to under the current prefix?
  function getBucket(filePath) {
    const rel = relPath(filePath, prefix);
    // If prefix is not matched at all, it's not relevant to this view
    if (prefix !== '' && !filePath.startsWith(prefix + '/')) return null;
    
    // If it's the exact same as prefix, or has no slash after prefix, it's a root file
    if (!rel.includes('/')) return '(root)';
    
    // Otherwise it's in a subfolder
    return rel.split('/')[0];
  }

  (edges || []).forEach(([src, tgt]) => {
    const sf = getBucket(src);
    const tf = getBucket(tgt);
    
    // Count edges between buckets (including root <-> subfolder and root <-> root)
    if (sf && tf && map[sf] && map[sf][tf] !== undefined) {
      if (sf === tf && sf !== '(root)') return; // Ignore internal subfolder edges for matrix view (usually diagonal is separate)
      map[sf][tf]++;
    }
  });
  return map;
}

/** Assign a heat level based on how many edges touch this file */
function computeHeat(fileId, rawEdges) {
  let count = 0;
  (rawEdges || []).forEach(([s, t]) => { if (s === fileId || t === fileId) count++; });
  if (count >= 4) return 'red';
  if (count >= 2) return 'yellow';
  return 'blue';
}

/** Build RF nodes + edges for files under a folder prefix */
function buildFolderGraphData(prefix, fileTree, rawEdges) {
  const files = filesUnder(prefix, fileTree);
  const allFolders = getSubFolders(prefix, fileTree);
  const color = '#60A5FA';

  const nodes = files.map(f => ({
    id: f, type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      label: f.split('/').pop(),
      folder: relPath(f, prefix).includes('/') ? relPath(f, prefix).split('/')[0] : prefix || 'root',
      accent: allFolders.length > 0
        ? folderColor(relPath(f, prefix).split('/')[0], allFolders)
        : color,
      heat: computeHeat(f, rawEdges),
      description: relPath(f, prefix),
    }
  }));

  const fileSet = new Set(files);
  const edges = (rawEdges || [])
    .filter(([s, t]) => fileSet.has(s) && fileSet.has(t))
    .map(([s, t], i) => ({
      id: `fg${i}`, source: s, target: t, animated: true,
      style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 }
    }));

  return { nodes, edges };
}

/** Build RF nodes for cross-sub-folder view */
function buildCrossSubFolderData(sub1, sub2, prefix, rawEdges, fileTree, allSubs) {
  const fullPrefix1 = prefix ? `${prefix}/${sub1}` : sub1;
  const fullPrefix2 = prefix ? `${prefix}/${sub2}` : sub2;

  const files1 = filesUnder(fullPrefix1, fileTree);
  const files2 = filesUnder(fullPrefix2, fileTree);
  const set1 = new Set(files1);
  const set2 = new Set(files2);
  const color1 = folderColor(sub1, allSubs);
  const color2 = folderColor(sub2, allSubs);

  const relevantEdges = (rawEdges || []).filter(([s, t]) =>
    (set1.has(s) && set2.has(t)) || (set2.has(s) && set1.has(t))
  );
  const touchedFiles = new Set();
  relevantEdges.forEach(([s, t]) => { touchedFiles.add(s); touchedFiles.add(t); });

  const nodes = [...touchedFiles].map(f => ({
    id: f, type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      label: f.split('/').pop(),
      folder: set1.has(f) ? sub1 : sub2,
      accent: set1.has(f) ? color1 : color2,
      heat: computeHeat(f, rawEdges),
      description: set1.has(f) ? `Depends on ${sub2}/` : `Used by ${sub1}/`,
    }
  }));

  const edges = relevantEdges.map(([s, t], i) => ({
    id: `cs${i}`, source: s, target: t, animated: true,
    style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 }
  }));

  return { nodes, edges };
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function DecoupledToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit   ={{ opacity: 0, y: 10, scale: 0.97  }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50
                     flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            background: '#1E232E',
            boxShadow: '6px 6px 14px #141820, -6px -6px 14px #2a3248, inset 0 0 0 1px rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            minWidth: 340,
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#1A1F2B', boxShadow: 'inset 2px 2px 5px #141820, inset -2px -2px 5px #283048' }}>
            <Unlink size={14} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Decoupled</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              No direct dependencies between these modules.
            </p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0"
            style={{ boxShadow: '0 0 6px #22d3ee' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GraphNode({ data, selected }) {
  const c = data.isNew ? '#4ade80' : data.isRemoved ? '#f87171' : (data.accent || '#94A3B8');
  const heatColor = data.heat === 'red' ? '#F87171'
    : data.heat === 'yellow' ? '#FBBF24' : '#60A5FA';

  const isSpecial = data.isNew || data.isRemoved;
  const shadowValue = isSpecial 
    ? `0 0 28px ${c}66, inset 2px 2px 5px rgba(255,255,255,0.1), inset -2px -2px 5px rgba(0,0,0,0.5)`
    : selected
      ? `0 0 28px ${c}44, inset 2px 2px 5px #283048, inset -2px -2px 5px #141820`
      : '5px 5px 12px #141820, -5px -5px 12px #2a3240';

  const borderValue = isSpecial ? `1px solid ${c}` : selected ? `1px solid ${c}88` : '1px solid rgba(255,255,255,0.05)';

  return (
    <motion.div
      className="relative cursor-pointer group"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: data.isRemoved ? 0 : 1, scale: data.isRemoved ? 0.8 : 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Handle type="target" position={Position.Top}
        style={{ background: c, border: 'none', top: -4, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom}
        style={{ background: c, border: 'none', bottom: -4, width: 8, height: 8 }} />

      <div
        className="w-[220px] px-4 py-3 rounded-xl relative overflow-hidden"
        style={{
          background: '#1E232E',
          boxShadow: shadowValue,
          border: borderValue,
          transition: 'box-shadow 0.6s ease-out, border 0.6s ease-out',
        }}
      >
        <div
          className="absolute top-0 right-0 w-9 h-9 pointer-events-none"
          style={{
            background: c,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            opacity: 0.8,
          }}
        />
        <div className="flex flex-col gap-1.5 pr-5">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: heatColor, boxShadow: `0 0 8px ${heatColor}88` }}
            />
            <span className="text-[11px] font-mono text-gray-200 truncate max-w-[160px]">
              {data.label}
            </span>
          </div>
          {data.description && (
            <p className="text-[10px] text-gray-400 leading-snug truncate">
              {data.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: c, opacity: 0.75 }}
            >
              {data.folder}/
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
const nodeTypes = { custom: GraphNode };

// ─── DAG Layout ────────────────────────────────────────────────────────────────
function layoutDAG(nodes, edges) {
  if (nodes.length === 0) return nodes;
  const adj = {};
  const inDeg = {};
  nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
  edges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target);
    if (inDeg[e.target] !== undefined) inDeg[e.target]++;
  });
  const layers = {};
  const roots = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  if (roots.length === 0) roots.push(nodes[0].id);
  roots.forEach(id => { layers[id] = 0; });
  const visited = new Set(roots);
  let front = [...roots];
  while (front.length > 0) {
    const next = [];
    for (const id of front) {
      for (const child of (adj[id] || [])) {
        layers[child] = Math.max(layers[child] || 0, layers[id] + 1);
        if (!visited.has(child)) { visited.add(child); next.push(child); }
      }
    }
    front = next;
  }
  nodes.forEach(n => { if (layers[n.id] === undefined) layers[n.id] = 0; });
  const layerGroups = {};
  nodes.forEach(n => {
    const l = layers[n.id];
    if (!layerGroups[l]) layerGroups[l] = [];
    layerGroups[l].push(n);
  });
  const X_GAP = 280;
  const Y_GAP = 160;
  return nodes.map(n => {
    const layer = layers[n.id];
    const group = layerGroups[layer];
    const idx   = group.indexOf(n);
    const total = group.length;
    const xOffset = -(total - 1) * X_GAP / 2;
    return { ...n, position: { x: xOffset + idx * X_GAP, y: layer * Y_GAP } };
  });
}

// ─── View Toggle ───────────────────────────────────────────────────────────────
function ViewToggle({ view, setView, isLeafFolder, onReportClick }) {
  const options = [
    { key: 'matrix', label: 'Matrix', Icon: Grid3X3, disabled: isLeafFolder },
    { key: 'graph',  label: 'Graph',  Icon: Network, disabled: false },
    { key: 'timeline', label: 'Time', Icon: History, disabled: false },
    { key: 'report', label: 'Report', Icon: FileText, disabled: false }
  ];

  return (
    <div className="relative flex items-center">
      <div
        className="flex items-center rounded-full p-1 relative"
        style={{
          background: '#1A1F2B',
          boxShadow: 'inset 3px 3px 7px #131722, inset -3px -3px 7px #232a3a',
          border: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        {/* Sliding active pill */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 84, height: 30, top: 4,
            background: '#1E232E',
            boxShadow: '4px 4px 10px #131722, -4px -4px 10px #2a3248',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          animate={{ x: view === 'matrix' ? 0 : view === 'graph' ? 88 : 176 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        />
        {options.map(({ key, label, Icon, disabled }) => (
          <button
            key={key}
            onClick={() => {
              if (disabled) return;
              if (key === 'report') {
                onReportClick();
              } else {
                setView(key);
              }
            }}
            disabled={disabled}
            className="relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors duration-200"
            style={{
              width: 88,
              color: view === key ? '#E2E8F0' : disabled ? '#374151' : '#6B7280',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.3 : 1,
            }}
          >
            <Icon size={12} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>
      {/* Leaf tooltip */}
      {isLeafFolder && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="ml-3 text-[9px] text-gray-600 font-mono whitespace-nowrap"
        >
          Matrix view requires sub-folders
        </motion.div>
      )}
    </div>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ currentFolder, onNavigate }) {
  const parts = currentFolder ? currentFolder.split('/') : [];
  const crumbs = [{ label: 'root', path: '' }];
  let acc = '';
  parts.forEach(p => {
    acc = acc ? `${acc}/${p}` : p;
    crumbs.push({ label: p, path: acc });
  });

  return (
    <div className="flex items-center gap-1 text-[10px] font-mono">
      {crumbs.map((c, i) => (
        <div key={c.path} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={10} className="text-gray-700" />}
          <button
            onClick={() => onNavigate(c.path)}
            className="transition-colors duration-200 hover:text-cyan-400"
            style={{
              color: i === crumbs.length - 1 ? '#E2E8F0' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Axis Button ───────────────────────────────────────────────────────────────
function AxisButton({ label, color, isHighlighted, onClick, isRow = false }) {
  const [hovered, setHovered] = useState(false);
  const glow = hovered || isHighlighted;
  return (
    <motion.button
      onHoverStart={() => setHovered(true)}
      onHoverEnd  ={() => setHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap  ={{ scale: 0.95 }}
      className="flex items-center justify-center rounded-xl cursor-pointer select-none"
      style={{
        width: 64, height: isRow ? 64 : 28,
        background: '#1E232E',
        boxShadow: glow
          ? `5px 5px 12px #141820, -5px -5px 12px #2a3248, 0 0 16px ${color}33`
          : '5px 5px 12px #141820, -5px -5px 12px #2a3248',
        border: `1px solid ${glow ? color + '44' : 'rgba(255,255,255,0.04)'}`,
        color: glow ? color : '#555E6E',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease, color 0.3s ease',
      }}
    >
      <span className="font-mono font-medium" style={{
        fontSize: 10, letterSpacing: '0.06em',
      }}>{label}</span>
    </motion.button>
  );
}

// ─── Macro Matrix ──────────────────────────────────────────────────────────────
const CELL_SIZE = 64;
const CELL_GAP  = 8;

function MacroMatrix({ subFolders, matrixData, onCellClick, onAxisClick }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);

  const allBuckets = useMemo(() => ['(root)', ...subFolders], [subFolders]);

  const maxVal = useMemo(() => {
    let m = 1;
    allBuckets.forEach(r => allBuckets.forEach(c => { if ((matrixData[r]?.[c] || 0) > m) m = matrixData[r][c]; }));
    return m;
  }, [allBuckets, matrixData]);

  if (allBuckets.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <Grid3X3 size={32} strokeWidth={1} className="text-gray-700 opacity-50" />
        <p className="text-xs font-mono text-gray-600 uppercase tracking-widest text-center">
          Matrix view requires folders or files
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-auto">
      <p className="absolute top-5 text-[10px] font-mono tracking-[0.2em] text-gray-700 uppercase pointer-events-none">
        Dependency Structure Matrix
      </p>

      <div className="flex flex-col">
        <div className="flex items-end" style={{ marginLeft: CELL_SIZE + CELL_GAP + 4, gap: CELL_GAP, marginBottom: CELL_GAP }}>
          {allBuckets.map(col => (
            <AxisButton key={`h-${col}`} label={col === '(root)' ? 'files' : col}
              color={col === '(root)' ? '#94A3B8' : folderColor(col, subFolders)}
              isHighlighted={hoveredCol === col}
              onClick={() => onAxisClick(col)} />
          ))}
        </div>
        {allBuckets.map(row => (
          <div key={`row-${row}`} className="flex items-center" style={{ gap: CELL_GAP, marginBottom: CELL_GAP }}>
            <AxisButton label={row === '(root)' ? 'files' : row} 
              color={row === '(root)' ? '#94A3B8' : folderColor(row, subFolders)}
              isHighlighted={hoveredRow === row} isRow onClick={() => onAxisClick(row)} />
            {allBuckets.map(col => {
              const count    = matrixData[row]?.[col] || 0;
              const isActive = count > 0;
              const isDiag   = row === col && row !== '(root)';
              const color    = col === '(root)' ? '#94A3B8' : folderColor(col, subFolders);
              const intensity = isActive ? Math.max(0.2, count / maxVal) : 0;
              
              return (
                <motion.div key={`${row}-${col}`}
                  onHoverStart={() => { setHoveredRow(row); setHoveredCol(col); }}
                  onHoverEnd  ={() => { setHoveredRow(null); setHoveredCol(null); }}
                  onClick={() => onCellClick(row, col, isActive)}
                  whileHover={isActive ? { scale: 1.1, zIndex: 10 } : {}}
                  className="rounded-xl relative flex items-center justify-center group"
                  style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    cursor: isActive ? 'pointer' : 'default',
                    background: '#1E232E',
                    boxShadow: isActive
                      ? '6px 6px 14px #141820, -6px -6px 14px #2a3248'
                      : 'inset 4px 4px 8px #141820, inset -4px -4px 8px #283048',
                    border: isActive
                      ? `1px solid ${color}${Math.round(intensity * 100).toString(16).padStart(2,'0')}`
                      : '1px solid transparent',
                    opacity: isDiag ? 0.2 : 1,
                    transition: 'box-shadow 0.3s ease, border 0.3s ease',
                  }}
                >
                  {isActive && (
                    <>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center relative overflow-hidden" 
                        style={{
                          background: `${color}15`,
                          border: `1px solid ${color}44`,
                          boxShadow: `0 0 ${10 + intensity * 15}px ${color}33`,
                        }}>
                        <div className="absolute inset-0 opacity-20" style={{ background: color }} />
                        <span className="relative text-[11px] font-bold font-mono" style={{ color }}>
                          {count}
                        </span>
                      </div>
                      
                      {/* Sub-indicator dot for aesthetic flavor */}
                      <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full" 
                        style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                    </>
                  )}
                  {isDiag && <div className="w-1 h-1 rounded-full bg-gray-700" />}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="absolute bottom-5 text-[10px] font-mono tracking-[0.2em] text-gray-700 uppercase pointer-events-none">
        Click a lit cell or axis label to explore
      </p>
    </div>
  );
}

// ─── File Graph Canvas ─────────────────────────────────────────────────────────
function FileGraph({ graphData, onNodeClick }) {
  const initNodes = useMemo(() => layoutDAG(graphData.nodes, graphData.edges), [graphData]);
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(graphData.edges);
  const isEmpty = nodes.length === 0;

  return (
    <div className="w-full h-full relative">
      {isEmpty ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-600">
          <GitBranch size={32} strokeWidth={1} className="opacity-25" />
          <p className="text-sm font-mono">No file dependencies found.</p>
          <p className="text-[10px] opacity-40">This folder may contain independent files.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.35 }}
          minZoom={0.2} maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" gap={32} size={1} color="rgba(255,255,255,0.04)" />
          <Controls showInteractive={false} position="bottom-left"
            style={{ marginBottom: 20, marginLeft: 20 }} />
        </ReactFlow>
      )}
    </div>
  );
}

// ─── Time Machine Canvas ───────────────────────────────────────────────────────
function TimeMachineGraph({ repoId }) {
  return (
    <div className="w-full h-full relative">
       <TimeMachineContainer repoId={repoId} />
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function DependencyGraph({ onNodeClick, onMatrixCellClick, apiData, currentFolder, onNavigateFolder }) {
  const navigate = useNavigate();
  const fileTree = apiData?.file_tree?.length ? apiData.file_tree : MOCK_FILE_TREE;
  const rawEdges = apiData?.edges?.length     ? apiData.edges      : MOCK_EDGES;

  // Derive context from currentFolder
  const folderPrefix = currentFolder || '';
  const subFolders = useMemo(() => getSubFolders(folderPrefix, fileTree), [folderPrefix, fileTree]);
  const isLeafFolder = subFolders.length === 0;

  // View state: auto-lock to graph if leaf (but allow timeline)
  const [viewPref, setViewPref] = useState('matrix');
  const view = (isLeafFolder && viewPref === 'matrix') ? 'graph' : viewPref;

  // When currentFolder changes, reset to matrix if available, but preserve time machine if active.
  useEffect(() => {
    setViewPref((prev) => {
      if (prev === 'timeline') return 'timeline';
      return isLeafFolder ? 'graph' : 'matrix';
    });
    setCrossCellCtx(null);
  }, [currentFolder, isLeafFolder]);

  // Matrix data for sub-folders
  const matrixData = useMemo(() =>
    buildMatrixData(subFolders, folderPrefix, rawEdges, fileTree),
    [subFolders, folderPrefix, rawEdges, fileTree]
  );

  // Toast
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    if (showToast) {
      const id = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(id);
    }
  }, [showToast]);

  // Cross-cell context (when user clicks a matrix cell, switch to graph with that context)
  const [crossCellCtx, setCrossCellCtx] = useState(null);

  const graphData = useMemo(() => {
    if (crossCellCtx) {
      return buildCrossSubFolderData(
        crossCellCtx.sub1, crossCellCtx.sub2,
        folderPrefix, rawEdges, fileTree, subFolders
      );
    }
    return buildFolderGraphData(folderPrefix, fileTree, rawEdges);
  }, [crossCellCtx, folderPrefix, rawEdges, fileTree, subFolders]);

  const handleCellClick = useCallback((row, col, isActive) => {
    if (!isActive) {
      setShowToast(false);
      requestAnimationFrame(() => setShowToast(true));
      return;
    }
    // Switch to graph view showing cross-folder dependency
    setCrossCellCtx({ sub1: row, sub2: col });
    setViewPref('graph');
    if (onMatrixCellClick) onMatrixCellClick({ sub1: row, sub2: col, folder: folderPrefix });
  }, [onMatrixCellClick, folderPrefix]);

  const handleAxisClick = useCallback((sub) => {
    // Navigate into that sub-folder
    const newPath = folderPrefix ? `${folderPrefix}/${sub}` : sub;
    if (onNavigateFolder) onNavigateFolder(newPath);
  }, [folderPrefix, onNavigateFolder]);

  const handleBackFromCross = useCallback(() => {
    setCrossCellCtx(null);
    setViewPref('matrix');
  }, []);

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden relative flex flex-col"
      style={{
        background: '#1E232E',
        boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #283048',
      }}
    >
      {/* ── Top bar: Breadcrumb + View Toggle ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0 z-20">
        <Breadcrumb currentFolder={folderPrefix} onNavigate={(path) => {
          if (onNavigateFolder) onNavigateFolder(path);
        }} />
        <ViewToggle 
           view={view} 
           setView={(v) => { setCrossCellCtx(null); setViewPref(v); }} 
           isLeafFolder={isLeafFolder} 
           onReportClick={() => {
              const githubUrl = apiData?.github_url || "";
              const urlParts = githubUrl.split("/");
              const owner = urlParts[urlParts.length - 2] || "mock_owner";
              const repo = urlParts[urlParts.length - 1] || apiData?.repo_id || "repo";
              navigate(`/report/${owner}/${repo}`);
           }}
        />
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {view === 'matrix' && !crossCellCtx ? (
            <motion.div
              key="matrix-view"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit   ={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full absolute inset-0"
            >
              <MacroMatrix
                subFolders={subFolders}
                matrixData={matrixData}
                onCellClick={handleCellClick}
                onAxisClick={handleAxisClick}
              />
            </motion.div>
          ) : view === 'timeline' ? (
            <motion.div
              key="timeline-view"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit   ={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full absolute inset-0"
            >
              <TimeMachineGraph repoId={apiData?.repo_id} />
            </motion.div>
          ) : (
            <motion.div
              key={`graph-view-${JSON.stringify(crossCellCtx)}`}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit   ={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full absolute inset-0"
            >
              <ReactFlowProvider>
                <FileGraph graphData={graphData} onNodeClick={onNodeClick} />
              </ReactFlowProvider>

              {/* Cross-cell back button */}
              {crossCellCtx && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  onClick={handleBackFromCross}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg
                             text-white/70 hover:text-white transition-colors"
                  style={{
                    background: 'rgba(30,35,46,0.6)',
                    boxShadow: '4px 4px 10px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Back to Matrix</span>
                </motion.button>
              )}

              {/* Cross-cell heading badge */}
              {crossCellCtx && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5
                                rounded-2xl text-[10px] font-mono pointer-events-none z-40"
                  style={{
                    background: 'rgba(30,35,46,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}>
                  <span className="font-semibold" style={{ color: folderColor(crossCellCtx.sub1, subFolders) }}>
                    {crossCellCtx.sub1}/
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="font-semibold" style={{ color: folderColor(crossCellCtx.sub2, subFolders) }}>
                    {crossCellCtx.sub2}/
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DecoupledToast visible={showToast} />
      </div>
    </div>
  );
}