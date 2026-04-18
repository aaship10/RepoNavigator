import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoadingTransition from '../components/LoadingTransition';
import { analyzeRepoStream } from '../services/api';

export default function AnalyzePage({ setApiData }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repoUrl = searchParams.get('url');
  
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const analysisDataRef = useRef(null);

  const startAnalysis = useCallback(async (url) => {
    try {
      const data = await analyzeRepoStream(url, (update) => {
        setProgress(update.value);
        setStatusMessage(update.message);
      });
      console.log("🔵 [AnalyzePage] Analysis complete:", data);
      analysisDataRef.current = data;
      setApiData(data); // Set global state
    } catch (err) {
      console.error("🔥 [AnalyzePage] Analysis failed:", err);
      setError(err.message);
    }
  }, [setApiData]);

  useEffect(() => {
    if (repoUrl) {
      startAnalysis(repoUrl);
    } else {
      navigate('/');
    }
  }, [repoUrl, startAnalysis, navigate]);

  const handleComplete = () => {
    // Navigate using the ID returned by the API, or fallback to URL part
    const repoId = analysisDataRef.current?.repo_id || repoUrl.split('/').filter(Boolean).pop();
    navigate(`/repo/${repoId}`); 
  };

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Analysis Failed</h2>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <LoadingTransition 
      progress={progress} 
      statusMessage={statusMessage} 
      onComplete={handleComplete}
    />
  );
}
