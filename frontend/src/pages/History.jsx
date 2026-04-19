import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Clock, ArrowRight, ServerCrash, Loader2, GitBranch } from 'lucide-react';
import { fetchHistory } from '../services/api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (err) {
        setError(err.message || 'Failed to load history');
        if (err.message.includes('token') || err.message.includes('login')) {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neu-bg">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-neu-bg flex justify-center">
      <div className="w-full max-w-4xl pt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{
                   background: '#1E232E',
                   boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248'
                 }}>
              <Database className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-wide">Analysis History</h1>
              <p className="text-sm text-text-muted mt-1">Your securely saved architectural scans.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:text-accent-cyan"
            style={{
              background: '#232939',
              boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
              border: '1px solid rgba(255,255,255,0.03)'
            }}
          >
            New Analysis
          </button>
        </div>

        {error && (
          <div className="p-4 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <ServerCrash className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!error && history.length === 0 && (
          <div className="p-12 text-center rounded-3xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <GitBranch className="w-12 h-12 mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text-secondary mb-2">No history yet</h3>
            <p className="text-text-muted">Start analyzing repositories and they will appear here.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/repo/${item.repo_name}`)}
              className="group text-left p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
              style={{
                background: '#1E232E',
                boxShadow: '6px 6px 15px #141820, -6px -6px 15px #2a3248',
                border: '1px solid rgba(255,255,255,0.02)'
              }}
              whileHover={{
                y: -5,
                boxShadow: '8px 8px 20px #141820, -8px -8px 20px #2a3248, inset 0 0 0 1px rgba(34, 211, 238, 0.2)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-accent-cyan" />
                  <span className="text-xs font-bold text-gray-500 tracking-wider">REPOSITORY</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary truncate w-full group-hover:text-accent-cyan transition-colors">
                  {item.repo_name}
                </h3>
                <p className="text-xs text-text-muted truncate w-full mt-1.5 opacity-80">
                  {item.repo_url}
                </p>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0"
                     style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
                  <ArrowRight className="w-4 h-4 text-accent-cyan" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
