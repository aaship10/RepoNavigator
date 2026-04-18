import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowDownRight, ArrowUpRight, Zap, Brain, Shield, Loader2, RefreshCw } from 'lucide-react';
import { mockAIData } from '../../data/mockData';
import { fetchFileDetails } from '../../services/api';

function RiskBar({ risk }) {
  const getColor = (r) => {
    if (r >= 80) return { bg: '#F87171', glow: 'rgba(248,113,113,0.3)' };
    if (r >= 50) return { bg: '#FBBF24', glow: 'rgba(251,191,36,0.3)' };
    return { bg: '#4ADE80', glow: 'rgba(74,222,128,0.3)' };
  };
  const { bg, glow } = getColor(risk);

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-muted font-medium flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Dependency Risk
        </span>
        <span className="text-xs font-bold" style={{ color: bg }}>{risk}%</span>
      </div>
      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{
          background: '#1A1F2B',
          boxShadow: 'inset 2px 2px 4px #141820, inset -2px -2px 4px #283048',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${risk}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{
            background: bg,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      </div>
    </div>
  );
}

function DependencyList({ title, items, icon: Icon, color }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        {title}
      </h4>
      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 hover:bg-neu-highlight/30 cursor-default"
            style={{
              background: '#1E232E',
              boxShadow: '2px 2px 5px #141820, -2px -2px 5px #232939',
            }}
          >
            <span className="text-text-secondary font-mono text-xs">{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SafeRender({ content, label = "Item" }) {
  if (!content) return <p className="opacity-40 italic">No details provided.</p>;

  // 1. Primitive Strings
  if (typeof content === 'string') {
    return <p className="leading-relaxed">{content}</p>;
  }

  // 2. Arrays of Objects or Strings
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-3">
        {content.map((item, i) => (
          <li key={i} className="flex flex-col gap-1">
            {typeof item === 'object' && item !== null ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60 flex-shrink-0" />
                  <span className="font-bold text-text-primary text-[13px]">
                    {item.name || item.step || item.title || `${label} ${i + 1}`}
                  </span>
                </div>
                <div className="pl-3.5 text-text-secondary border-l border-white/5 ml-0.5 mt-0.5">
                  {item.purpose || item.description || item.detail || JSON.stringify(item)}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-text-muted/40 flex-shrink-0" />
                <span>{String(item)}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // 3. Fallback for unexpected objects (Complex JSON)
  if (typeof content === 'object') {
    return (
      <pre className="text-[10px] font-mono bg-black/30 p-3 rounded-xl overflow-x-auto border border-white/5 text-accent-cyan/80">
        <code>{JSON.stringify(content, null, 2)}</code>
      </pre>
    );
  }

  return <p>{String(content)}</p>;
}

export default function AIPanel({ selectedNode, repoId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔍 [AIPanel.jsx] AIPanel useEffect triggered for node:", selectedNode, "with repoId:", repoId);
    
    async function fetchData() {
      if (!selectedNode || !repoId) {
        console.log("⏭️ [AIPanel.jsx] Skipping fetch: selectedNode or repoId missing.");
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("🚀 [AIPanel.jsx] Fetching AI details...");
        const response = await fetchFileDetails(repoId, selectedNode);
        console.log("✅ [AIPanel.jsx] AI Data received:", response);
        
        // Map backend response to panel structure
        const mockFallback = mockAIData[selectedNode] || {
          summary: "Analysis pending...",
          risk: 20,
          dependsOn: [],
          usedBy: [],
          keyFunctions: []
        };

        setData({
          ...mockFallback,
          summary: response.ai_insights || mockFallback.summary,
        });
      } catch (err) {
        console.error("❌ [AIPanel.jsx] Failed to fetch AI insights:", err);
        setError("AI analysis unavailable for this file.");
        setData(mockAIData[selectedNode] || null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedNode, repoId]);

  return (
    <AnimatePresence mode="wait">
      {selectedNode && data ? (
        <motion.div
          key={selectedNode}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full flex flex-col overflow-hidden relative"
          style={{
            background: '#1A1F2B',
            boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
            borderRadius: '16px',
          }}
        >
          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 backdrop-blur-sm bg-[#1A1F2B]/60"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-accent-cyan" />
                  </motion.div>
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 blur-md bg-accent-cyan/20 rounded-full"
                  />
                </div>
                <p className="text-xs font-mono text-accent-cyan/80 animate-pulse">Gemini analyzing...</p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: '#1E232E',
                  boxShadow: 'inset 2px 2px 4px #141820, inset -2px -2px 4px #283048',
                }}
              >
                <Brain className="w-4 h-4 text-accent-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">AI Analysis</h3>
                <p className="text-[10px] text-text-muted font-mono">{selectedNode}</p>
              </div>
            </div>
            <button
              id="close-ai-panel"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-neu-highlight"
              style={{
                background: '#232939',
                boxShadow: '2px 2px 5px #141820, -2px -2px 5px #283048',
              }}
            >
              <X className="w-3.5 h-3.5 text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
            {/* Structured AI Insights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              {/* 1. The Summary */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                  Executive Summary
                </h4>
                <div
                  className={`text-sm leading-relaxed p-4 rounded-xl transition-all duration-500 ${error ? 'text-heat-red border border-heat-red/20' : 'text-text-secondary'}`}
                  style={{
                    background: '#1E232E',
                    boxShadow: 'inset 2px 2px 5px #141820, inset -2px -2px 5px #232939',
                  }}
                >
                  {error ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  ) : (
                    <SafeRender content={typeof data.summary === 'object' ? data.summary.summary : data.summary} />
                  )}
                </div>
              </div>

              {/* 2. Key Logic & Functions */}
              {typeof data.summary === 'object' && data.summary.functions && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-accent-magenta" />
                    Logical Functions
                  </h4>
                  <div className="text-sm text-text-secondary leading-relaxed p-4 rounded-xl border border-white/5" style={{ background: 'rgba(232, 121, 249, 0.03)' }}>
                    <SafeRender content={data.summary.functions} label="Function" />
                  </div>
                </motion.div>
              )}

              {/* 3. Data Flow */}
              {typeof data.summary === 'object' && data.summary.data_flow && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-accent-cyan" />
                    Data Flow Analysis
                  </h4>
                  <div className="text-sm text-text-secondary leading-relaxed p-4 rounded-xl border border-white/5" style={{ background: 'rgba(34, 211, 238, 0.03)' }}>
                    <SafeRender content={data.summary.data_flow} label="Step" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Risk Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <RiskBar risk={data.risk} />
            </motion.div>

            {/* Dependencies */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DependencyList
                title="Depends On"
                items={data.dependsOn}
                icon={ArrowDownRight}
                color="#F87171"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <DependencyList
                title="Used By"
                items={data.usedBy}
                icon={ArrowUpRight}
                color="#4ADE80"
              />
            </motion.div>

            {/* Key Functions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-magenta" />
                Key Functions
              </h4>
              <div className="space-y-1">
                {data.keyFunctions?.map((fn, i) => (
                  <motion.div
                    key={fn}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + 0.05 * i }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 hover:bg-neu-highlight/30 cursor-default"
                    style={{
                      background: '#1E232E',
                      boxShadow: '2px 2px 5px #141820, -2px -2px 5px #232939',
                      color: '#E879F9',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-magenta/50 flex-shrink-0" />
                    {fn}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Dead code warning */}
            {data.risk === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: 'rgba(248, 113, 113, 0.06)',
                  boxShadow: 'inset 2px 2px 5px #141820, inset -2px -2px 5px #232939',
                }}
              >
                <AlertTriangle className="w-4 h-4 text-heat-red mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-heat-red mb-1">Orphaned Module</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    This file has no active imports. Consider removing it to reduce bundle size and maintenance overhead.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex flex-col items-center justify-center px-6 text-center"
          style={{
            background: '#1A1F2B',
            boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
            borderRadius: '16px',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: '#1E232E',
              boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #283048',
            }}
          >
            <Brain className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted font-medium mb-1">No module selected</p>
          <p className="text-xs text-text-muted/60">Click a node or file to view AI analysis</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
