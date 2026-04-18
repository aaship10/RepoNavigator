import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadingStages } from '../data/mockData';

// Orbital particle for the central animation
function OrbitalParticle({ radius, duration, delay, size, color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      animate={{
        rotate: 360,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 ${size * 2}px ${color}`,
          top: -radius,
          left: 0,
        }}
      />
    </motion.div>
  );
}

// Pulsing ring
function PulseRing({ size, delay, color }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: `${color}33`,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      animate={{
        scale: [0.8, 1.15, 0.8],
        opacity: [0.4, 0.1, 0.4],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

// Network graph SVG for background
function NetworkBackground() {
  const nodes = [
    { x: '10%', y: '20%' }, { x: '25%', y: '60%' }, { x: '40%', y: '30%' },
    { x: '55%', y: '70%' }, { x: '70%', y: '25%' }, { x: '85%', y: '55%' },
    { x: '15%', y: '80%' }, { x: '60%', y: '15%' }, { x: '80%', y: '80%' },
    { x: '35%', y: '85%' }, { x: '90%', y: '35%' }, { x: '50%', y: '50%' },
  ];

  const edges = [
    [0, 2], [2, 4], [4, 7], [7, 10], [1, 3], [3, 5], [5, 8],
    [6, 9], [2, 11], [11, 5], [1, 11], [11, 4], [0, 1], [3, 9],
  ];

  return (
    <svg className="absolute inset-0 w-full h-full opacity-20">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#6366F1"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{
            duration: 2.5,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          cx={node.x} cy={node.y} r="3"
          fill="#22D3EE"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
          transition={{
            duration: 2,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      ))}
    </svg>
  );
}

// Data stream particle flying across the screen
function DataStream({ delay }) {
  const y = 10 + Math.random() * 80;
  return (
    <motion.div
      className="absolute h-px"
      style={{
        top: `${y}%`,
        left: '-10%',
        width: '30px',
        background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
        boxShadow: '0 0 6px #22D3EE',
      }}
      animate={{ left: '110%' }}
      transition={{
        duration: 1.5 + Math.random(),
        delay,
        repeat: Infinity,
        repeatDelay: 2 + Math.random() * 3,
        ease: 'linear',
      }}
    />
  );
}

export default function LoadingTransition({ onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stageIndex = 0;
    let elapsed = 0;
    const totalDuration = loadingStages.reduce((acc, s) => acc + s.duration, 0);

    const interval = setInterval(() => {
      elapsed += 50;
      const overallProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(overallProgress);

      // Calculate which stage we're in
      let accumulated = 0;
      for (let i = 0; i < loadingStages.length; i++) {
        accumulated += loadingStages[i].duration;
        if (elapsed < accumulated) {
          setCurrentStage(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#1E232E' }}
    >
      {/* Background network */}
      <NetworkBackground />

      {/* Data streams */}
      {Array.from({ length: 8 }).map((_, i) => (
        <DataStream key={i} delay={i * 0.4} />
      ))}

      {/* Central orb animation */}
      <div className="relative w-72 h-72 mb-12">
        {/* Pulse rings */}
        <PulseRing size={280} delay={0} color="#22D3EE" />
        <PulseRing size={220} delay={0.5} color="#6366F1" />
        <PulseRing size={160} delay={1} color="#E879F9" />

        {/* Orbital particles */}
        <OrbitalParticle radius={120} duration={4} delay={0} size={8} color="#22D3EE" />
        <OrbitalParticle radius={90} duration={5} delay={0.5} size={6} color="#E879F9" />
        <OrbitalParticle radius={60} duration={3} delay={1} size={5} color="#6366F1" />
        <OrbitalParticle radius={140} duration={6} delay={0.3} size={4} color="#60A5FA" />

        {/* Core glow */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            top: '50%',
            left: '50%',
            marginTop: -30,
            marginLeft: -30,
            background: 'radial-gradient(circle, rgba(99,102,241,0.6), rgba(34,211,238,0.3), transparent)',
            boxShadow: '0 0 60px rgba(99,102,241,0.4), 0 0 120px rgba(34,211,238,0.2)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Center icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Status text */}
      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium shimmer-text mb-6 h-7"
          >
            {loadingStages[currentStage]?.text}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div
          className="w-80 h-2 rounded-full overflow-hidden"
          style={{
            background: '#1A1F2B',
            boxShadow: 'inset 2px 2px 6px #141820, inset -2px -2px 6px #283048',
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #6366F1, #22D3EE, #E879F9)',
              boxShadow: '0 0 12px rgba(34,211,238,0.4)',
              width: `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        <p className="text-xs text-text-muted mt-3 font-mono">
          {Math.round(progress)}% complete
        </p>
      </div>
    </motion.div>
  );
}
