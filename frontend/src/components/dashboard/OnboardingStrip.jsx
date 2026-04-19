import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockOnboardingPath } from '../../data/mockData';

const heatColors = {
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#9CA3AF',
  blue: '#60A5FA',
};

import { Search, X, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function OnboardingStrip({ onSelectFile, globalQueryText, isStreamingQuery, onCloseQuery }) {
  const scrollRef = useRef(null);

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
            {mockOnboardingPath.length} critical modules
          </span>
        </div>
      </div>

      {/* Content Area: Timeline or Query Result */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {globalQueryText || isStreamingQuery ? (
            <motion.div
              key="query-result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 flex flex-col px-6 pb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-accent-cyan">
                  {isStreamingQuery ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isStreamingQuery ? 'AI is thinking...' : 'AI Response'}
                  </span>
                </div>
                <button
                  onClick={onCloseQuery}
                  className="p-1 hover:bg-white/5 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                }}
              >
                <div className="text-sm text-text-secondary leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{globalQueryText}</ReactMarkdown>
                  {isStreamingQuery && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-1.5 h-4 bg-accent-cyan ml-1 align-middle"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={scrollRef}
              className="flex items-center gap-0 overflow-x-auto px-6 pb-4 pt-1 no-scrollbar h-full"
              style={{ scrollBehavior: 'smooth' }}
            >
              {mockOnboardingPath.map((item, index) => {
                const color = heatColors[item.heat] || heatColors.blue;
                return (
                  <div key={item.id} className="flex items-center flex-shrink-0">
                    {/* Step card */}
                    <motion.button
                      onClick={() => onSelectFile(item.file.split('.')[0].toLowerCase())}
                      className="flex flex-col items-start gap-1.5 px-5 py-3 rounded-2xl transition-all duration-300 cursor-pointer group min-w-[160px] relative overflow-hidden"
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
                          {item.id}
                        </div>
                        <span className="text-lg leading-none">{item.icon}</span>
                      </div>

                      <span className="text-[11px] font-bold text-gray-200 group-hover:text-cyan-400 transition-colors font-mono truncate w-full text-left">
                        {item.file}
                      </span>

                      <span className="text-[9px] text-gray-500 leading-relaxed text-left line-clamp-2 w-full opacity-80">
                        {item.desc}
                      </span>
                    </motion.button>

                    {/* Connector line */}
                    {index < mockOnboardingPath.length - 1 && (
                      <div className="flex items-center flex-shrink-0 mx-2">
                        <div className="relative flex items-center justify-center w-12">
                          {/* Background line */}
                          <div className="h-[1px] w-full bg-gray-800" />
                          
                          {/* Animated flow line */}
                          <motion.div
                            className="absolute left-0 h-[2px] rounded-full"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${heatColors[mockOnboardingPath[index+1].heat] || '#6366F1'}, transparent)`,
                              boxShadow: `0 0 10px ${heatColors[mockOnboardingPath[index+1].heat] || '#6366F1'}44`
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
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
