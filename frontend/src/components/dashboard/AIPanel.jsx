import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ArrowDownRight, ArrowUpRight, Zap, Brain, Shield } from 'lucide-react';
import { mockAIData } from '../../data/mockData';

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

export default function AIPanel({ selectedNode, onClose }) {
  const data = mockAIData[selectedNode];

  return (
    <AnimatePresence mode="wait">
      {selectedNode && data ? (
        <motion.div
          key={selectedNode}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full flex flex-col overflow-hidden"
          style={{
            background: '#1A1F2B',
            boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
            borderRadius: '16px',
          }}
        >
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
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                Summary
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed p-4 rounded-xl"
                style={{
                  background: '#1E232E',
                  boxShadow: 'inset 2px 2px 5px #141820, inset -2px -2px 5px #232939',
                }}
              >
                {data.summary}
              </p>
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
