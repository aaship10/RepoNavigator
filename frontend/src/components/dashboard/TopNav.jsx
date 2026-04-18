import { motion } from 'framer-motion';
import { Search, GitBranch, Sparkles, Settings, Bell } from 'lucide-react';

export default function TopNav({ repoUrl }) {
  const repoName = repoUrl
    ? repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
    : 'owner/repository';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-4 px-4 h-full w-full"
      style={{
        background: 'rgba(30, 35, 46, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
            boxShadow: '0 0 15px rgba(99,102,241,0.3)',
          }}
        >
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-text-primary leading-none">RepoNav</p>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">{repoName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/5 flex-shrink-0" />

      {/* Search Bar — Central */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 group cursor-text"
          style={{
            background: 'rgba(35, 41, 57, 0.6)',
            boxShadow: 'inset 2px 2px 5px #141820, inset -2px -2px 5px #283048',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            id="nlp-search-input"
            type="text"
            placeholder="Ask anything... (e.g., 'Where is auth handled?')"
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted/60 w-full"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono text-text-muted"
              style={{
                background: '#1E232E',
                boxShadow: '1px 1px 3px #141820, -1px -1px 3px #283048',
              }}
            >
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-neu-highlight"
          style={{
            background: '#232939',
            boxShadow: '2px 2px 5px #141820, -2px -2px 5px #283048',
          }}
        >
          <Sparkles className="w-4 h-4 text-accent-cyan" />
        </button>
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-neu-highlight"
          style={{
            background: '#232939',
            boxShadow: '2px 2px 5px #141820, -2px -2px 5px #283048',
          }}
        >
          <Bell className="w-4 h-4 text-text-muted" />
        </button>
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-neu-highlight"
          style={{
            background: '#232939',
            boxShadow: '2px 2px 5px #141820, -2px -2px 5px #283048',
          }}
        >
          <Settings className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </motion.div>
  );
}
