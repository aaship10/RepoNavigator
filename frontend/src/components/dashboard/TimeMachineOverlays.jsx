import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Clock, GitCommit, PlusCircle, MinusCircle } from 'lucide-react';
import { fetchCommitHistory, fetchCommitInsights } from '../../services/api';

// ─── Master Container ────────────────────────────────────────────────────────
export default function TimeMachineContainer({ repoId }) {
  const [commits, setCommits] = useState([]);
  const [currentCommitIdx, setCurrentCommitIdx] = useState(0);
  const [activeNarrative, setActiveNarrative] = useState("Loading history...");
  const [activeDiff, setActiveDiff] = useState(null);

  // 1. Fetch commit history on mount
  useEffect(() => {
    if (!repoId) return;
    let isMounted = true;
    
    async function loadCommits() {
      try {
        const data = await fetchCommitHistory(repoId);
        if (isMounted && data.length > 0) {
          const reversed = [...data].reverse(); // Oldest left, newest right
          setCommits(reversed);
          setCurrentCommitIdx(reversed.length - 1); // Start at most recent
        }
      } catch (err) {
        console.error("Failed to load commits", err);
      }
    }
    loadCommits();
    return () => { isMounted = false; };
  }, [repoId]);

  // 2. Fetch AI Insights when the active commit changes
  useEffect(() => {
    if (commits.length === 0) return;
    let isMounted = true;
    
    async function loadInsights() {
      try {
        setActiveNarrative('Analyzing architectural changes...');
        setActiveDiff(null);
        
        const sha = commits[currentCommitIdx].full_sha;
        const data = await fetchCommitInsights(repoId, sha);
        
        if (isMounted) {
          setActiveNarrative(data.narrative);
          setActiveDiff(data.diffSummary);
        }
      } catch (err) {
        if (isMounted) setActiveNarrative('Failed to analyze this commit.');
      }
    }
    
    // Debounce to prevent spamming API while sliding
    const timer = setTimeout(() => { loadInsights(); }, 400);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [currentCommitIdx, commits, repoId]);

  if (commits.length === 0) return null;

  return (
    <>
      <ArchitectDiary narrative={activeNarrative} />
      <DiffOverlay diffSummary={activeDiff} />
      <TimelineSlider 
        steps={commits} 
        currentIndex={currentCommitIdx} 
        onChange={setCurrentCommitIdx} 
      />
    </>
  );
}

// ─── Timeline Slider ─────────────────────────────────────────────────────────
export function TimelineSlider({ steps, currentIndex, onChange }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-2/3 max-w-3xl">
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
                  <p className="text-cyan-400 font-mono text-[10px] font-bold">{step.sha}</p>
                  <p className="text-gray-300 text-[10px] truncate">{step.message}</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Architect's Diary ────────────────────────────────────────────────────────
export function ArchitectDiary({ narrative }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [narrative]);

  useEffect(() => {
    if (narrative && index < narrative.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + narrative[index]);
        setIndex(prev => prev + 1);
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [index, narrative]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute bottom-28 left-6 z-40 w-72 rounded-2xl p-5"
      style={{
        background: 'rgba(30,35,46,0.7)',
        boxShadow: '4px 4px 15px rgba(0,0,0,0.4), -4px -4px 15px rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="flex items-center gap-2 mb-3 text-cyan-400">
        <Clock size={16} />
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Architect's Diary</span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed font-mono min-h-[60px]">
        {displayedText}
        <motion.span 
          animate={{ opacity: [1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 align-middle"
        />
      </p>
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
      key={`diff-${diffSummary.added}-${diffSummary.removed}`}
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