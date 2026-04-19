import { motion } from 'framer-motion';
import { X, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function GlobalChatPanel({ queryText, isStreaming, onClose }) {
  return (
    <div 
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        background: '#1E232E',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.03)',
        boxShadow: '8px 8px 20px #141820, -8px -8px 20px #2a3248',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
              boxShadow: '0 0 15px rgba(99,102,241,0.3)' 
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary leading-tight">Codebase AI</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                {isStreaming ? 'Streaming Logic...' : 'Context Ready'}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/5"
          style={{
            background: '#232939',
            boxShadow: '2px 2px 5px #141820, -2px -2px 5px #283048',
          }}
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 custom-scrollbar"
        style={{
          scrollPaddingBottom: '2rem'
        }}
      >
        <div className="flex flex-col gap-6">
          {/* User Input Bubble (Simulated) */}
          {queryText && (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-text-secondary leading-relaxed">
                <ReactMarkdown>{queryText}</ReactMarkdown>
                {isStreaming && (
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-1.5 h-4 bg-accent-cyan ml-1 align-middle"
                  />
                )}
              </div>
            </div>
          )}

          {!queryText && isStreaming && (
            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
              <p className="text-xs font-mono tracking-widest uppercase">Analyzing codebase...</p>
            </div>
          )}

          {!queryText && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-30">
              <MessageSquare className="w-12 h-12" />
              <p className="text-sm">Ask anything about the architecture.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/10 border-t border-white/5">
        <p className="text-[9px] text-text-muted text-center uppercase tracking-[0.2em]">
          Powered by Llama 3.3 70B & Groq
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
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
