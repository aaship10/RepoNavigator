import { useRef } from 'react';
import { motion } from 'framer-motion';

const heatColors = {
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#9CA3AF',
  blue: '#60A5FA',
};

// Derive a display icon from the file extension
function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  const map = {
    js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
    py: '🐍', html: '🌐', css: '🎨', json: '📦',
    md: '📝', txt: '📄', sh: '🖥️', env: '🔐',
  };
  return map[ext] || '📄';
}

// Infer a heat color from the filename's position in the path (just aesthetics)
function getHeatForIndex(index, total) {
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.33) return 'blue';
  if (ratio < 0.66) return 'yellow';
  return 'red';
}

export default function OnboardingStrip({ path = [], onSelectFile }) {
  const scrollRef = useRef(null);
  const isEmpty = !path || path.length === 0;

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: '#1A1F2B',
        boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
               style={{ background: '#1E232E', boxShadow: 'inset 2px 2px 4px #141820, inset -2px -2px 4px #283048' }}>
            <span className="text-xs">🗺️</span>
          </div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Onboarding Path
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ boxShadow: '0 0 8px #10b981' }} />
          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">
            {isEmpty ? 'No file selected' : `${path.length} modules`}
          </span>
        </div>
      </div>

      {/* Scrolling timeline */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-0 overflow-x-auto px-6 pb-4 pt-1 no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-gray-600 italic">
              Click a file in the graph to see its recommended reading order
            </p>
          </div>
        ) : (
          path.map((filePath, index) => {
            const fileName = filePath.split('/').pop();
            const heat = getHeatForIndex(index, path.length);
            const color = heatColors[heat] || heatColors.blue;
            const icon = getFileIcon(fileName);

            return (
              <div key={filePath} className="flex items-center flex-shrink-0">
                {/* Step card */}
                <motion.button
                  onClick={() => onSelectFile && onSelectFile(filePath)}
                  className="flex flex-col items-start gap-1.5 px-5 py-4 rounded-2xl transition-all duration-300 cursor-pointer group min-w-[160px] relative overflow-hidden"
                  style={{
                    background: '#232939',
                    boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                    boxShadow: `6px 12px 20px #141820, -6px -6px 20px #2a3248, 0 0 20px ${color}15`,
                    borderColor: `${color}33`,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Decorative glow corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none"
                       style={{
                         background: `radial-gradient(circle at top right, ${color}, transparent 70%)`
                       }} />

                  <div className="flex items-center gap-2.5 mb-0.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                         style={{
                           background: '#1A1F2B',
                           boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)',
                           color: color,
                         }}>
                      {index + 1}
                    </div>
                    <span className="text-lg leading-none">{icon}</span>
                  </div>

                  <span className="text-[11px] font-bold text-gray-200 group-hover:text-cyan-400 transition-colors font-mono truncate w-full text-left">
                    {fileName}
                  </span>

                  <span className="text-[9px] text-gray-500 leading-relaxed text-left line-clamp-2 w-full opacity-80 font-mono">
                    {filePath !== fileName ? filePath : 'Root file'}
                  </span>
                </motion.button>

                {/* Connector line */}
                {index < path.length - 1 && (
                  <div className="flex items-center flex-shrink-0 mx-2">
                    <div className="relative flex items-center justify-center w-12">
                      {/* Background line */}
                      <div className="h-[1px] w-full bg-gray-800" />
                      {/* Animated flow line */}
                      <motion.div
                        className="absolute left-0 h-[2px] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${heatColors[getHeatForIndex(index + 1, path.length)]}, transparent)`,
                          boxShadow: `0 0 10px ${heatColors[getHeatForIndex(index + 1, path.length)]}44`
                        }}
                        animate={{
                          left: ['-20%', '100%'],
                          width: ['20%', '40%', '20%'],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          delay: index * 0.4,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
