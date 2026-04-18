import { useRef } from 'react';
import { motion } from 'framer-motion';
import { mockOnboardingPath } from '../../data/mockData';

const heatColors = {
  red: '#F87171',
  yellow: '#FBBF24',
  grey: '#9CA3AF',
  blue: '#60A5FA',
};

export default function OnboardingStrip({ onSelectFile }) {
  const scrollRef = useRef(null);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: '#1A1F2B',
        boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
        borderRadius: '16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">🗺️</span>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            Onboarding Path
          </h3>
        </div>
        <span className="text-[10px] text-text-muted/60 font-mono">
          {mockOnboardingPath.length} critical files — topologically sorted
        </span>
      </div>

      {/* Scrolling timeline */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-0 overflow-x-auto px-5 pb-3 pt-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {mockOnboardingPath.map((item, index) => (
          <div key={item.id} className="flex items-center flex-shrink-0">
            {/* Step card */}
            <motion.button
              onClick={() => onSelectFile(item.file.replace('.tsx', '').replace('.ts', '').replace('.json', '').toLowerCase())}
              className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer group min-w-[120px]"
              style={{
                background: '#232939',
                boxShadow: '3px 3px 8px #141820, -3px -3px 8px #283048',
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: `4px 4px 12px #141820, -4px -4px 12px #283048, 0 0 15px ${heatColors[item.heat]}22`,
              }}
              whileTap={{
                scale: 0.97,
                boxShadow: 'inset 2px 2px 6px #141820, inset -2px -2px 6px #283048',
              }}
            >
              {/* Step number + icon */}
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: heatColors[item.heat] + '22',
                    color: heatColors[item.heat],
                  }}
                >
                  {item.id}
                </span>
                <span className="text-base">{item.icon}</span>
              </div>

              {/* File name */}
              <span className="text-xs font-semibold text-text-primary group-hover:text-accent-cyan transition-colors font-mono truncate max-w-[100px]">
                {item.file}
              </span>

              {/* Description */}
              <span className="text-[10px] text-text-muted leading-tight text-center line-clamp-2 max-w-[100px]">
                {item.desc}
              </span>
            </motion.button>

            {/* Connector line */}
            {index < mockOnboardingPath.length - 1 && (
              <div className="flex items-center flex-shrink-0 mx-1">
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Animated dotted line */}
                  <svg width="32" height="4" className="flex-shrink-0">
                    <motion.line
                      x1="0" y1="2" x2="32" y2="2"
                      stroke="#6366F1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      strokeOpacity="0.4"
                      animate={{ strokeDashoffset: [0, -6] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </svg>
                  {/* Arrow dot */}
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: '#6366F1',
                      boxShadow: '0 0 4px rgba(99,102,241,0.4)',
                    }}
                  />
                </motion.div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
