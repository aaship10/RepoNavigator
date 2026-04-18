import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CubeLoader from './ui/CubeLoader';

// ─── Cycling status phrases ────────────────────────────────────────────────────
const PHRASES = [
  'Cloning repository...',
  'Extracting module relationships...',
  'Parsing Abstract Syntax Trees...',
  'Calculating structural PageRank...',
  'Mapping graph topologies...',
  'Initializing Antigravity engine...',
];

// ─── Main Loader Component ─────────────────────────────────────────────────────
export default function LoadingTransition({ onComplete, progress = 0, statusMessage = '' }) {
  const completeFired = useRef(false);
  const [internalMessage, setInternalMessage] = useState('Initializing Antigravity...');
  const [phraseIdx, setPhraseIdx] = useState(0);

  // Fallback phrase cycling if statusMessage is empty
  useEffect(() => {
    if (statusMessage) {
      setInternalMessage(statusMessage);
    } else {
      const id = setInterval(() => {
        setPhraseIdx(prev => (prev + 1) % PHRASES.length);
      }, 2000);
      return () => clearInterval(id);
    }
  }, [statusMessage]);

  useEffect(() => {
    if (statusMessage) setInternalMessage(statusMessage);
  }, [statusMessage]);

  // Handle completion
  useEffect(() => {
    if (progress >= 100 && !completeFired.current) {
      completeFired.current = true;
      // Allow a brief moment for the user to see the 100% state
      setTimeout(() => onComplete?.(), 1000);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#1E232E' }}
    >
      {/* Background ambient dots (Keeping for aesthetics) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 2,
            height: 2 + Math.random() * 2,
            top:  `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: ['#22D3EE', '#6366F1', '#E879F9', '#FBBF24'][i % 4],
          }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{
            duration: 3 + Math.random() * 3,
            delay: Math.random() * 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Central Cube animation ── */}
      <div className="relative mb-8 scale-75 md:scale-100">
        <CubeLoader title={statusMessage} />
      </div>

      {/* ── Status text with AnimatePresence crossfade ── */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="h-7 mb-5 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusMessage || phraseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit   ={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-mono tracking-wide"
              style={{
                background: 'linear-gradient(90deg, #22D3EE, #E879F9, #6366F1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {statusMessage || PHRASES[phraseIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Neumorphic progress bar ── */}
        <div
          className="w-80 h-2.5 rounded-full overflow-hidden relative"
          style={{
            background: '#1A1F2B',
            boxShadow: 'inset 3px 3px 6px #131722, inset -3px -3px 6px #232a3a',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366F1, #22D3EE, #E879F9)',
              boxShadow: '0 0 14px rgba(34,211,238,0.5), 0 0 30px rgba(99,102,241,0.2)',
              transition: 'width 0.4s ease-out',
            }}
          />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute top-0 h-full w-16 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            }}
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
          />
        </div>

        <p className="text-[11px] text-gray-600 mt-3 font-mono tracking-wider">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* App title watermark */}
      <motion.p
        className="absolute bottom-8 text-[10px] font-mono tracking-[0.3em] uppercase"
        style={{ color: '#2a3248' }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        Repository Architecture Navigator
      </motion.p>
    </motion.div>
  );
}
