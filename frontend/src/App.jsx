import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import LoadingTransition from './components/LoadingTransition';
import Dashboard from './components/Dashboard';
import { analyzeRepo } from './services/api';

// View states: 'landing' | 'loading' | 'dashboard'

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [repoUrl, setRepoUrl] = useState('');
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [apiStatus, setApiStatus] = useState('idle');

  const handleAnalyze = useCallback(async (url) => {
    console.log("🚀 [App.jsx] Analysis triggered for URL:", url);
    setRepoUrl(url);
    setError(null);
    setApiStatus('loading');
    setIsAnimationComplete(false);
    setCurrentView('loading');
    
    try {
      const data = await analyzeRepo(url);
      console.log("🔵 [App.jsx] API Data successfully received and set:", data);
      setApiData(data);
      setApiStatus('success');
    } catch (err) {
      console.error("🔥 [App.jsx] Analysis failed:", err);
      setError(err.message);
      setApiStatus('error');
      setCurrentView('landing');
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    console.log("⏱️ [App.jsx] Loading animation complete.");
    setIsAnimationComplete(true);
  }, []);

  useEffect(() => {
    if (currentView === 'loading' && apiStatus === 'success' && isAnimationComplete) {
      console.log("🏁 [App.jsx] All conditions met. Transitioning to dashboard.");
      setCurrentView('dashboard');
    }
  }, [currentView, apiStatus, isAnimationComplete]);

  return (
    <div className="min-h-screen bg-neu-bg">
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <LandingPage key="landing" onAnalyze={handleAnalyze} />
        )}
        {currentView === 'loading' && (
          <LoadingTransition key="loading" onComplete={handleLoadingComplete} />
        )}
        {currentView === 'dashboard' && (
          <Dashboard key="dashboard" repoUrl={repoUrl} apiData={apiData} />
        )}
      </AnimatePresence>
    </div>
  );
}
