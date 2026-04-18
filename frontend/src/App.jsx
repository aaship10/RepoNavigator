import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import LoadingTransition from './components/LoadingTransition';
import Dashboard from './components/Dashboard';

// View states: 'landing' | 'loading' | 'dashboard'

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [repoUrl, setRepoUrl] = useState('');

  const handleAnalyze = useCallback((url) => {
    setRepoUrl(url);
    setCurrentView('loading');
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

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
          <Dashboard key="dashboard" repoUrl={repoUrl} />
        )}
      </AnimatePresence>
    </div>
  );
}
