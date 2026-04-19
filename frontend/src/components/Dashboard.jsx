import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopNav from './dashboard/TopNav';
import FileSidebar from './dashboard/FileSidebar';
import DependencyGraph from './dashboard/DependencyGraph';
import AIPanel from './dashboard/AIPanel';
import OnboardingStrip from './dashboard/OnboardingStrip';
import { streamGlobalQuery } from '../services/api';

export default function Dashboard({ apiData }) {
  const { repoId } = useParams();
  const navigate = useNavigate();

  // Redirect if data is missing (e.g. refresh)
  useEffect(() => {
    if (!apiData && !repoId) {
      navigate('/');
    }
  }, [apiData, repoId, navigate]);

  const repoUrlForNav = apiData?.repo_id || repoId || '';

  const [selectedNode, setSelectedNode] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');

  // Global Query Streaming State
  const [globalQueryText, setGlobalQueryText] = useState('');
  const [isStreamingQuery, setIsStreamingQuery] = useState(false);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNode(nodeId);
    setShowAIPanel(!!nodeId);
  }, []);

  const handleMatrixClick = useCallback((cellData) => {
    setShowAIPanel(!!cellData);
  }, []);

  const handleFileSelect = useCallback((fileId) => {
    setSelectedNode(fileId);
    setShowAIPanel(true);
  }, []);

  const handleFolderSelect = useCallback((folderId) => {
    // When clicking a folder in the sidebar, update the canvas context
    setCurrentFolder(folderId || '');
  }, []);

  const handleNavigateFolder = useCallback((path) => {
    setCurrentFolder(path || '');
  }, []);

  const handleGlobalSearch = useCallback(async (query) => {
    if (!query || !repoId) return;

    setGlobalQueryText('');
    setIsStreamingQuery(true);

    try {
      await streamGlobalQuery(repoId, query, (chunk) => {
        setGlobalQueryText((prev) => prev + chunk);
      });
    } catch (err) {
      setGlobalQueryText(`❌ Error: ${err.message}`);
    } finally {
      setIsStreamingQuery(false);
    }
  }, [repoId]);

  const handleCloseQuery = useCallback(() => {
    setGlobalQueryText('');
    setIsStreamingQuery(false);
  }, []);

  const handleCloseAI = useCallback(() => {
    setShowAIPanel(false);
    setSelectedNode(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: '#1E232E' }}
    >
      {/* Top Nav — fixed height bar */}
      <div className="h-14 flex-shrink-0 w-full">
        <TopNav repoUrl={repoUrlForNav} onSearch={handleGlobalSearch} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3" style={{ minHeight: 0 }}>
        {/* Left Sidebar — 20% */}
        <div className="w-1/5 min-w-[240px] max-w-[320px] flex-shrink-0 relative z-20">
          <div className="w-full h-full rounded-2xl p-4 overflow-hidden"
               style={{
                 background: '#1E232E',
                 boxShadow: 'inset 4px 4px 10px #141820, inset -4px -4px 10px #283048'
               }}>
            <FileSidebar 
              onSelectFile={handleFileSelect}
              onSelectFolder={handleFolderSelect}
              selectedFile={selectedNode} 
              files={apiData?.file_tree || []}
            />
          </div>
        </div>

        {/* Center + Right */}
        <div className="flex-1 flex gap-4 min-w-0 h-full">
          {/* Center Column: Graph + Bottom Strip */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
            {/* Dependency Graph — Fills remaining space */}
            <div className="flex-1 min-w-0">
              <DependencyGraph
                onNodeClick={handleNodeClick}
                onMatrixCellClick={handleMatrixClick}
                apiData={apiData}
                currentFolder={currentFolder}
                onNavigateFolder={handleNavigateFolder}
              />
            </div>

            {/* Bottom Onboarding Strip — 15% height */}
            <div className="flex-shrink-0" style={{ height: '15%', minHeight: '120px' }}>
              <OnboardingStrip 
                onSelectFile={handleNodeClick} 
                globalQueryText={globalQueryText}
                isStreamingQuery={isStreamingQuery}
                onCloseQuery={handleCloseQuery}
              />
            </div>
          </div>

          {/* AI Panel — 25% when visible. Framer Motion slide in */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div 
                initial={{ x: '100%', opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: '25%' }}
                exit={{ x: '100%', opacity: 0, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="min-w-[280px] max-w-[380px] flex-shrink-0 h-full overflow-hidden"
              >
                <AIPanel
                  selectedNode={selectedNode}
                  repoId={apiData?.repo_id}
                  onClose={handleCloseAI}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}