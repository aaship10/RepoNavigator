// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Clock, GitCommit, PlusCircle, MinusCircle } from 'lucide-react';
import { fetchCommitHistory, fetchCommitInsights } from '../../services/api';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

// Reuse your DAG layout utility to arrange nodes cleanly on screen
function layoutEvolutionDAG(nodes) {
  if (nodes.length === 0) return nodes;
  const layers = {};
  nodes.forEach(n => { layers[n.id] = 0; });
  const X_GAP = 280;
  const Y_GAP = 160;
  
  // Basic layered distribution for visualization consistency
  return nodes.map((n, idx) => {
    const layer = idx % 3;
    const rowIdx = Math.floor(idx / 3);
    return { ...n, position: { x: rowIdx * X_GAP - 200, y: layer * Y_GAP - 50 } };
  });
}

// ─── Master Container ────────────────────────────────────────────────────────
export default function TimeMachineContainer({ repoId, apiData }) {
  const [commits, setCommits] = useState([]);
  const [currentCommitIdx, setCurrentCommitIdx] = useState(0);
  const [activeNarrative, setActiveNarrative] = useState("Loading history...");
  const [activeDiff, setActiveDiff] = useState(null);
  const [activeDelta, setActiveDelta] = useState(null);

  // React Flow instance states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 1. Fetch commit history on mount
  useEffect(() => {
    if (!repoId) return;
    let isMounted = true;
    
    async function loadCommits() {
      try {
        const data = await fetchCommitHistory(repoId);
        if (isMounted && data.length > 0) {
          const reversed = [...data].reverse();
          setCommits(reversed);
          setCurrentCommitIdx(reversed.length - 1);
        }
      } catch (err) {
        console.error("Failed to load commits", err);
      }
    }
    loadCommits();
    return () => { isMounted = false; };
  }, [repoId]);

// 2. Fetch AI Insights and Delta changes when commit changes
  useEffect(() => {
    if (commits.length === 0) return;
    let isMounted = true;
    
    // ✅ The async wrapper is correctly defined here
    async function loadInsights() {
      try {
        if (isMounted) {
          setActiveNarrative('Analyzing architectural changes...');
          setActiveDiff(null);
          setActiveDelta(null);
        }
        
        const sha = commits[currentCommitIdx].full_sha;
        
        // ✅ Await safely used inside the async function
        const data = await fetchCommitInsights(repoId, sha);

        console.log("📦 RAW BACKEND DATA FOR COMMIT", sha, ":", data);
        
        if (isMounted) {
          setActiveNarrative(data.narrative);
          setActiveDiff(data.diffSummary || { added: data.added_lines || 0, removed: data.removed_lines || 0 });
          
          // ✅ Manually construct the delta object from the root backend response
          setActiveDelta({
            added_files: data.delta?.added_files || [],
            removed_files: data.delta?.removed_files || []
          });
        }
      } catch {
        if (isMounted) setActiveNarrative('Failed to analyze this commit.');
      }
    }
    
    // ✅ Call the async function with the debounce timer
    const timer = setTimeout(() => { loadInsights(); }, 400);
    return () => { isMounted = false; clearTimeout(timer); };
    
  }, [currentCommitIdx, commits, repoId]);

// 3. Dynamically compute evolution graph layers based on current delta
  useEffect(() => {
    if (!apiData || !apiData.file_tree) {
      return; 
    }

    const rawFiles = apiData.file_tree;
    const rawEdges = apiData.edges || [];

    // Identify which files are altered in this step
    const addedFiles = new Set(activeDelta?.added_files || []);
    const removedFiles = new Set(activeDelta?.removed_files || []);

    // 🚨 THE FIX: Combine current files with removed files so deleted nodes reappear!
    const allFilesToDraw = new Set([...rawFiles]);
    removedFiles.forEach(file => allFilesToDraw.add(file));

    // Map over the combined list instead of just rawFiles
    const computedNodes = Array.from(allFilesToDraw).map(f => {
      const fileName = f.split('/').pop();
      let accent = '#60A5FA'; // Default Blue
      let statusLabel = 'stable';

      if (addedFiles.has(f)) {
        accent = '#4ade80'; // Green
        statusLabel = 'added';
      } else if (removedFiles.has(f)) {
        accent = '#f87171'; // Red
        statusLabel = 'removed';
      }

      return {
        id: f,
        type: 'default',
        data: { label: `${fileName} (${statusLabel})` },
        position: { x: 0, y: 0 }, 
        style: {
          background: '#1E232E',
          color: '#F3F4F6',
          border: `2px solid ${accent}`,
          boxShadow: statusLabel !== 'stable' ? `0 0 15px ${accent}66` : 'none',
          borderRadius: '12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          padding: '10px',
          // Make ghost nodes slightly transparent
          opacity: statusLabel === 'removed' ? 0.7 : 1 
        }
      };
    });

    // We don't need to ghost edges for now, just the nodes
    const computedEdges = rawEdges.map((edge, i) => ({
      id: `ev-edge-${i}`,
      source: edge[0],
      target: edge[1],
      animated: true,
      style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 }
    }));

    setNodes(layoutEvolutionDAG(computedNodes));
    setEdges(computedEdges);
    
  }, [activeDelta, apiData, setNodes, setEdges]);

  console.log("⚛️ React Flow Nodes:", nodes);
  console.log("⚛️ React Flow Edges:", edges);
  return (  
    <div className="w-full h-full relative" style={{ height: '100%', minHeight: '500px' }}>
      {/* ── BACKGROUND LAYER: The Graph Canvas ── */}
      <div className="absolute inset-0 w-full h-full z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" gap={32} size={1} color="rgba(255,255,255,0.04)" />
          <Controls position="top-left" style={{ marginTop: 60, marginLeft: 10 }} />
        </ReactFlow>
      </div>

      {/* ── FOREGROUND LAYER: Controlling Overlays ── */}
      <ArchitectDiary narrative={activeNarrative} />
      <DiffOverlay diffSummary={activeDiff} />
      <TimelineSlider 
        steps={commits} 
        currentIndex={currentCommitIdx} 
        onChange={setCurrentCommitIdx} 
      />
    </div>
  );
}

// ─── Timeline Slider ─────────────────────────────────────────────────────────
export function TimelineSlider({ steps, currentIndex, onChange }) {
  return (
    <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 z-40 w-2/3 max-w-3xl overflow-visible">
      <div 
        className="relative h-14 rounded-full flex items-center px-8"
        style={{
          background: '#141820', 
          boxShadow: 'inset 4px 4px 10px #0b0d13, inset -4px -4px 10px #1d232e',
          border: '1px solid rgba(255,255,255,0.02)'
        }}
      >
        <div className="absolute left-8 right-8 h-1 rounded-full bg-gray-800" />
        
        <div className="absolute left-8 right-8 flex justify-between">
          {steps.map((step, idx) => (
             <div 
               key={idx} 
               onClick={() => onChange(idx)}
               className="relative w-4 h-4 -ml-2 rounded-full cursor-pointer z-10 flex items-center justify-center transition-colors group"
             >
               <div className={`w-2 h-2 rounded-full transition-colors ${idx <= currentIndex ? 'bg-cyan-400' : 'bg-gray-600'}`} />
               {idx === currentIndex && (
                 <motion.div 
                   layoutId="activeThumb"
                   className="absolute w-8 h-8 rounded-full pointer-events-none"
                   style={{
                     background: '#1E232E',
                     boxShadow: '0 0 15px rgba(34, 211, 238, 0.4), inset 2px 2px 4px rgba(255,255,255,0.1), inset -2px -2px 4px rgba(0,0,0,0.5)',
                     border: '1px solid rgba(34, 211, 238, 0.5)'
                   }}
                   transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                 />
               )}

               {/* Hover Tooltip */}
               <div className="absolute bottom-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E232E] border border-gray-700 rounded-md px-3 py-2 pointer-events-none w-48 text-center z-50">
                  <p className="text-cyan-400 font-mono text-[10px] font-bold">{step.sha || step.short_sha}</p>
                  <p className="text-gray-300 text-[10px] whitespace-normal leading-tight">{step.message}</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Architect's Diary (Fixed Card Height + Inner Text Containment) ──────────
export function ArchitectDiary({ narrative }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
   const timer = setTimeout(() => {
      setDisplayedText('');
      setIndex(0);
    }, 0);

    return () => clearTimeout(timer);
  }, [narrative]);

  useEffect(() => {
    if (narrative && index < narrative.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + narrative[index]);
        setIndex(prev => prev + 1);
      }, 12);

      // Auto-scalls internal box down smoothly if text expands past boundary
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }

      return () => clearTimeout(timer);
    }
  }, [index, narrative]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-24 left-6 z-40 w-80 rounded-2xl p-5 flex flex-col"
      style={{
        height: '240px', // Explicit layout boundary constraints
        background: 'rgba(30,35,46,0.85)',
        boxShadow: '4px 4px 15px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="flex items-center gap-2 mb-2 text-cyan-400 flex-shrink-0">
        <Clock size={16} />
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Architect's Diary</span>
      </div>
      
      {/* Scrollable interior viewport wrapper */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-1 text-xs text-gray-300 leading-relaxed font-mono selection:bg-cyan-500/30"
        style={{ scrollbarWidth: 'thin', maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }}
      >
        {displayedText}
        <motion.span 
          animate={{ opacity: [1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 align-middle"
        />
      </div>
    </motion.div>
  );
}

// ─── Diff Overlay ─────────────────────────────────────────────────────────────
export function DiffOverlay({ diffSummary }) {
  if (!diffSummary) return null;

  const hasAdditions = diffSummary.added > 0;
  const hasRemovals = diffSummary.removed > 0;

  if (!hasAdditions && !hasRemovals) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-28 right-6 z-40 flex items-center gap-3 px-4 py-3 rounded-full"
      style={{
        background: '#1E232E',
        boxShadow: '6px 6px 14px #141820, -6px -6px 14px #2a3248',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <GitCommit size={14} className="text-gray-400 flex-shrink-0" />
      <div className="flex gap-4">
        {hasAdditions && (
          <div className="flex items-center gap-1.5 text-[#4ade80]" style={{ textShadow: '0 0 8px rgba(74, 222, 128, 0.4)' }}>
            <PlusCircle size={14} />
            <span className="text-xs font-mono font-bold">+{diffSummary.added} Lines</span>
          </div>
        )}
        {hasRemovals && (
          <div className="flex items-center gap-1.5 text-[#f87171]" style={{ textShadow: '0 0 8px rgba(248, 113, 113, 0.4)' }}>
            <MinusCircle size={14} />
            <span className="text-xs font-mono font-bold">-{diffSummary.removed} Lines</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}