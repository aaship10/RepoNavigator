import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { loginUser, signupUser } from '../services/api';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = isLogin 
        ? await loginUser(email, password) 
        : await signupUser(email, password);
        
      if (data && data.access_token) {
        localStorage.setItem('token', data.access_token);
        // Dispatch custom event to update TopNav immediately across the app
        window.dispatchEvent(new Event('authChange'));
        navigate('/history');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neu-bg relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-text-muted hover:text-text-primary transition-all duration-300 hover:scale-105"
        style={{
          background: '#232939',
          boxShadow: '4px 4px 10px #141820, -4px -4px 10px #2a3248',
          border: '1px solid rgba(255,255,255,0.03)'
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: '#1E232E',
          boxShadow: '10px 10px 20px #141820, -10px -10px 20px #2a3248',
          border: '1px solid rgba(255,255,255,0.03)'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
               style={{
                 background: '#232939',
                 boxShadow: 'inset 4px 4px 8px #141820, inset -4px -4px 8px #2a3248'
               }}>
            <Shield className="w-6 h-6 text-accent-cyan" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-text-muted mt-2">
            {isLogin ? 'Sign in to view your analysis history' : 'Sign up to start saving your analyses'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
              Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 placeholder-text-muted/50"
                style={{
                  background: '#1A1F2B',
                  boxShadow: 'inset 4px 4px 10px #141820, inset -4px -4px 10px #2a3248',
                  border: '1px solid transparent',
                  color: '#F8FAFC'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 placeholder-text-muted/50"
                style={{
                  background: '#1A1F2B',
                  boxShadow: 'inset 4px 4px 10px #141820, inset -4px -4px 10px #2a3248',
                  border: '1px solid transparent',
                  color: '#F8FAFC'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)'}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #22D3EE)',
              boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
            }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-text-muted hover:text-accent-cyan transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
