import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import ReportPage from './components/ReportPage';
import AuthView from './components/AuthView';
import History from './pages/History';

export default function App() {
  const location = useLocation();
  const [apiData, setApiData] = useState(null);

  return (
    <div className="min-h-screen bg-neu-bg">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing Route */}
          <Route 
            path="/" 
            element={<LandingPage onAnalyze={() => {}} />} 
          />

          {/* Analysis/Loading Route */}
          <Route 
            path="/analyze" 
            element={<AnalyzePage setApiData={setApiData} />} 
          />

          {/* Result Dashboard Route */}
          <Route 
            path="/repo/:repoId" 
            element={<Dashboard apiData={apiData} />} 
          />

          {/* Report Route */}
          <Route 
            path="/report/:owner/:repoName" 
            element={<ReportPage />} 
          />

          {/* Authentication Route */}
          <Route 
            path="/login" 
            element={<AuthView />} 
          />

          {/* History Route */}
          <Route 
            path="/history" 
            element={<History />} 
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
