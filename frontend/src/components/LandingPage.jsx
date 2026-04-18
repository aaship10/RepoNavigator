import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { GitBranch, Layers, Brain, Route, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const GITHUB_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;

// Floating holographic node for the hero
function HoloNode({ x, y, size, delay, color, label }) {
  return (
    <motion.div
      className="absolute rounded-2xl flex items-center justify-center font-mono text-xs"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: 'rgba(35, 41, 57, 0.7)',
        boxShadow: `4px 4px 10px #141820, -4px -4px 10px #283048, 0 0 20px ${color}33`,
      }}
      animate={{
        y: [0, -15, 0, 10, 0],
        rotate: [0, 1, -1, 0.5, 0],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: delay,
      }}
    >
      <span style={{ color, textShadow: `0 0 8px ${color}66` }}>{label}</span>
    </motion.div>
  );
}

// Glowing animated edge between nodes
function HoloEdge({ x1, y1, x2, y2, color, delay }) {
  return (
    <motion.line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      stroke={color}
      strokeWidth="1.5"
      strokeOpacity="0.4"
      strokeDasharray="6 4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
      transition={{
        pathLength: { duration: 2, delay },
        opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
}

// Scrollytelling feature card
function FeatureCard({ icon: Icon, title, description, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      className="neu-extruded p-8 flex flex-col items-start gap-4 group cursor-default"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-glow-cyan"
        style={{
          background: '#1E232E',
          boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #283048',
        }}
      >
        <Icon className="w-6 h-6 text-accent-cyan" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function LandingPage({ onAnalyze }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showError, setShowError] = useState(false);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef(null);

  // Scroll progress for hero parallax
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -60]);

  useEffect(() => {
    const valid = GITHUB_REGEX.test(repoUrl.trim());
    setIsValid(valid);
    if (touched && !valid && repoUrl.length > 0) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [repoUrl, touched]);

  const handleAnalyze = () => {
    if (isValid) {
      onAnalyze(repoUrl);
    } else {
      setTouched(true);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const features = [
    {
      icon: Layers,
      title: 'VS Code-Style Sidebar',
      description: 'Navigate your repository with an intuitive file explorer. Color-coded heat dots instantly reveal which files are critical, moderate, or orphaned.',
    },
    {
      icon: GitBranch,
      title: 'Dependency Heat Graph',
      description: 'Visualize every import relationship as an interactive node graph. Zoom, pan, and click to explore how modules depend on each other.',
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Click any file to get a plain-English AI summary, dependency risk score, and lists of what it depends on and what uses it.',
    },
    {
      icon: Route,
      title: 'Onboarding Path',
      description: 'A topologically-sorted reading order of the 14 most critical files. Perfect for new developers joining the team.',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-[200vh] relative">
      {/* ====== HERO SECTION ====== */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="h-screen flex flex-col items-center justify-center relative overflow-hidden holographic-grid"
      >
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #22D3EE, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #E879F9, transparent)' }} />

        {/* Holographic floating network */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full">
            <HoloEdge x1={20} y1={30} x2={40} y2={25} color="#22D3EE" delay={0} />
            <HoloEdge x1={40} y1={25} x2={60} y2={35} color="#6366F1" delay={0.3} />
            <HoloEdge x1={60} y1={35} x2={75} y2={28} color="#E879F9" delay={0.6} />
            <HoloEdge x1={40} y1={25} x2={35} y2={55} color="#6366F1" delay={0.8} />
            <HoloEdge x1={60} y1={35} x2={65} y2={60} color="#22D3EE" delay={1} />
            <HoloEdge x1={35} y1={55} x2={65} y2={60} color="#E879F9" delay={1.2} />
            <HoloEdge x1={15} y1={65} x2={35} y2={55} color="#22D3EE" delay={0.5} />
            <HoloEdge x1={75} y1={28} x2={85} y2={50} color="#6366F1" delay={0.9} />
          </svg>
          <HoloNode x={18} y={26} size={60} delay={0} color="#22D3EE" label="main" />
          <HoloNode x={38} y={21} size={72} delay={0.5} color="#F87171" label="App" />
          <HoloNode x={58} y={31} size={65} delay={1} color="#6366F1" label="api" />
          <HoloNode x={73} y={24} size={55} delay={1.5} color="#FBBF24" label="utils" />
          <HoloNode x={33} y={51} size={68} delay={0.8} color="#F87171" label="auth" />
          <HoloNode x={63} y={56} size={58} delay={1.3} color="#60A5FA" label="db" />
          <HoloNode x={13} y={61} size={50} delay={0.3} color="#9CA3AF" label="cfg" />
          <HoloNode x={83} y={46} size={52} delay={1.8} color="#E879F9" label="UI" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-accent-cyan neu-flat">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Architecture Analysis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            <span className="text-text-primary">Instantly Understand</span>
            <br />
            <span className="bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-magenta bg-clip-text text-transparent">
              Any Codebase.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-text-secondary text-lg md:text-xl mb-10 max-w-xl leading-relaxed"
          >
            Paste a GitHub URL. Get an interactive dependency graph, AI-powered file summaries, 
            and a guided onboarding path — in seconds.
          </motion.p>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
            className="w-full max-w-xl"
          >
            <div className="relative">
              <input
                id="repo-url-input"
                type="text"
                value={repoUrl}
                onChange={(e) => { setRepoUrl(e.target.value); setTouched(true); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="https://github.com/owner/repository"
                className="neu-input pr-36 text-sm md:text-base"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                  isValid
                    ? 'bg-accent-indigo text-white shadow-glow-indigo animate-pulse-glow cursor-pointer hover:bg-indigo-500'
                    : 'bg-neu-surface text-text-muted cursor-pointer hover:text-text-secondary'
                }`}
                style={
                  isValid
                    ? {}
                    : { boxShadow: '3px 3px 8px #141820, -3px -3px 8px #283048' }
                }
              >
                Analyze <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Validation hint */}
            <div className="mt-3 h-5 flex items-center justify-center">
              {isValid && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-accent-cyan flex items-center gap-1"
                >
                  ✓ Valid GitHub repository URL
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2 text-text-muted"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border border-text-muted/30 flex items-start justify-center p-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* ====== SCROLLYTELLING FEATURES ====== */}
      <section className="px-6 md:px-12 pb-32 pt-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-accent-cyan to-accent-magenta bg-clip-text text-transparent">
              navigate code
            </span>
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Four powerful tools working together to eliminate the chaos of understanding large codebases.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feat, i) => (
            <FeatureCard key={feat.title} {...feat} index={i} />
          ))}
        </div>
      </section>

      {/* ====== ERROR TOAST ====== */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 40, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'rgba(248, 113, 113, 0.12)',
              boxShadow: '0 0 30px rgba(248, 113, 113, 0.15), 4px 4px 10px #141820, -4px -4px 10px #283048',
              color: '#F87171',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AlertCircle className="w-4 h-4" />
            Please enter a valid GitHub repository URL
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
