import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Layers, Brain, Route, ArrowRight, AlertCircle,
  Sparkles, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveGrid from './InteractiveGrid';

const GITHUB_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;

/* ─────────────────────────────────────────────────────────────────────
   PURE PRESENTATIONAL COMPONENTS
───────────────────────────────────────────────────────────────────── */

/** Feature card */
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="neu-extruded p-8 flex flex-col items-start gap-4 group cursor-default"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-glow-cyan"
        style={{ background: '#1E232E', boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #283048' }}
      >
        <Icon className="w-6 h-6 text-accent-cyan" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* Static Hero Text Component (Auto-Staggered on Mount) */
function HeroText() {
  const w1 = "Instantly".split("");
  const w2 = "Understand".split("");
  
  return (
    <div className="flex flex-col items-center text-center pt-10 px-4 z-20 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mb-5"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-accent-cyan neu-flat border border-accent-cyan/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Architecture Analysis
        </span>
      </motion.div>

      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-extrabold leading-tight mb-4 tracking-tight drop-shadow-2xl">
        <span className="inline-block mr-5">
          {w1.map((char, i) => (
            <motion.span 
              key={i} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 + i * 0.04 }} 
              className="text-text-primary inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
        <span className="inline-block">
          {w2.map((char, i) => (
            <motion.span 
              key={i} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.6 + i * 0.04 }} 
              className="text-text-primary inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
        <br />
        <motion.span 
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="inline-block mt-2 bg-gradient-to-r from-accent-cyan via-accent-indigo to-accent-magenta bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        >
          Any Codebase.
        </motion.span>
      </h1>

      <HeroSubtitle />
    </div>
  );
}

function HeroSubtitle() {
  const text = "Paste a GitHub URL - get an interactive dependency graph, AI-powered file summaries, and a guided onboarding path in seconds.";
  const words = text.split(" ");
  return (
    <p className="text-text-secondary text-sm md:text-base max-w-2xl leading-relaxed mt-2 flex flex-wrap justify-center mx-auto">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 + (i * 0.02) }}
          className="mr-1.5 mb-1.5 inline-block"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   GITHUB URL INPUT 
───────────────────────────────────────────────────────────────────── */
function AnalyzeInput() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl]     = useState('');
  const [isValid, setIsValid]     = useState(false);
  const [showError, setShowError] = useState(false);
  const [touched, setTouched]     = useState(false);

  useEffect(() => {
    const valid = GITHUB_REGEX.test(repoUrl.trim());
    setIsValid(valid);
    if (touched && !valid && repoUrl.length > 0) setShowError(true);
    else setShowError(false);
  }, [repoUrl, touched]);

  const handleAnalyze = () => {
    if (isValid) {
      // Navigate to analysis route with URL as search param
      navigate(`/analyze?url=${encodeURIComponent(repoUrl.trim())}`);
    } else {
      setTouched(true);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <>
      <div className="relative w-full max-w-2xl">
        <input
          id="repo-url-input"
          type="text"
          value={repoUrl}
          onChange={(e) => { setRepoUrl(e.target.value); setTouched(true); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="https://github.com/owner/repository"
          className="neu-input pr-40 text-base md:text-lg w-full"
          style={{ fontFamily: "'JetBrains Mono', monospace", padding: '20px 24px', borderRadius: '16px' }}
        />
        <button
          id="analyze-btn"
          onClick={handleAnalyze}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-3.5 rounded-xl text-base font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
            isValid
              ? 'bg-accent-indigo text-white animate-pulse-glow hover:bg-indigo-500'
              : 'bg-neu-surface text-text-muted hover:text-text-secondary'
          }`}
          style={isValid ? { boxShadow: '0 0 20px rgba(99,102,241,0.4)' } : { boxShadow: '4px 4px 10px #141820, -4px -4px 10px #283048' }}
        >
          Analyze <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 h-5 flex items-center justify-center">
        {isValid && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-accent-cyan"
          >
            ✓ Valid GitHub repository URL
          </motion.span>
        )}
      </div>

      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0,  x: '-50%' }}
            exit={{ opacity: 0, y: 40,    x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'rgba(248,113,113,0.12)',
              boxShadow: '0 0 30px rgba(248,113,113,0.15), 4px 4px 10px #141820, -4px -4px 10px #283048',
              color: '#F87171',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AlertCircle className="w-4 h-4" />
            Please enter a valid GitHub repository URL
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LANDING PAGE — main export
───────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
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
    <div className="relative pb-24 flex flex-col items-center holographic-grid overflow-hidden">
      {/* ── Auth Navigation Header ── */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => navigate('/history')}
              className="px-5 py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 hover:border-cyan-500/30 text-sm font-bold text-text-primary group"
              style={{
                background: '#232939',
                boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
                border: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <Route className="w-4 h-4 text-accent-cyan group-hover:animate-pulse" />
              View History
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 text-sm font-bold text-red-200 group hover:border-red-500/20"
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
                border: '1px solid rgba(239, 68, 68, 0.1)',
              }}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 hover:border-cyan-500/30 text-sm font-bold text-text-primary group"
            style={{
              background: '#232939',
              boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            <Sparkles className="w-4 h-4 text-accent-cyan group-hover:animate-pulse" />
            Login / Sign Up
          </button>
        )}
      </div>

      <InteractiveGrid />
      {/* ── Ambient Orbs ── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.06] blur-[140px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #22D3EE, transparent)' }} />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.06] blur-[140px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E879F9, transparent)' }} />

      {/* ── 1. Hero Text ── */}
      <HeroText />

      {/* ── 2. URL Input Section ── */}
      <section className="flex flex-col items-center px-6 py-12 md:py-16 my-6 w-full z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-3xl mb-8"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-3">
            Ready to explore{' '}
            <span className="bg-gradient-to-r from-accent-cyan to-accent-indigo bg-clip-text text-transparent">
              your repository?
            </span>
          </h2>
          <p className="text-text-secondary text-sm md:text-base lg:text-lg">
            Paste any public GitHub URL and let RepoNavigator map it for you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.6, ease: 'easeOut' }}
          className="w-full flex flex-col items-center justify-center"
        >
          <AnalyzeInput />
        </motion.div>
      </section>

      {/* ── 3. Features Grid ── */}
      <section className="px-5 md:px-8 pt-8 pb-10 w-full max-w-5xl mx-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((F, i) => (
            <FeatureCard key={i} icon={F.icon} title={F.title} description={F.description} />
          ))}
        </motion.div>
      </section>
      
    </div>
  );
}