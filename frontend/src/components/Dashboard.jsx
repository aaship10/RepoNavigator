// import { useState, useCallback, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import TopNav from './dashboard/TopNav';
// import FileSidebar from './dashboard/FileSidebar';
// import DependencyGraph from './dashboard/DependencyGraph';
// import AIPanel from './dashboard/AIPanel';
// import OnboardingStrip from './dashboard/OnboardingStrip';
// import GlobalChatPanel from './dashboard/GlobalChatPanel';
// import { streamGlobalQuery } from '../services/api';

// export default function Dashboard({ apiData }) {
//   const { repoId } = useParams();
//   const navigate = useNavigate();

//   // Redirect if data is missing (e.g. refresh)
//   useEffect(() => {
//     if (!apiData && !repoId) {
//       navigate('/');
//     }
//   }, [apiData, repoId, navigate]);

//   const repoUrlForNav = apiData?.repo_id || repoId || '';

//   const [selectedNode, setSelectedNode] = useState(null);
//   const [showAIPanel, setShowAIPanel] = useState(false);
//   const [currentFolder, setCurrentFolder] = useState('');

//   // Global Query Streaming State
//   const [globalQueryText, setGlobalQueryText] = useState('');
//   const [isStreamingQuery, setIsStreamingQuery] = useState(false);
//   const [showGlobalChat, setShowGlobalChat] = useState(false);

//   const handleNodeClick = useCallback((nodeId) => {
//     setSelectedNode(nodeId);
//     setShowAIPanel(!!nodeId);
//     if (nodeId) setShowGlobalChat(false); // Close chat if a file is selected
//   }, []);

//   const handleMatrixClick = useCallback((cellData) => {
//     setShowAIPanel(!!cellData);
//     if (cellData) setShowGlobalChat(false);
//   }, []);

//   const handleFileSelect = useCallback((fileId) => {
//     setSelectedNode(fileId);
//     setShowAIPanel(true);
//     setShowGlobalChat(false);
//   }, []);

//   const handleFolderSelect = useCallback((folderId) => {
//     // When clicking a folder in the sidebar, update the canvas context
//     setCurrentFolder(folderId || '');
//   }, []);

//   const handleNavigateFolder = useCallback((path) => {
//     setCurrentFolder(path || '');
//   }, []);

//   const handleGlobalSearch = useCallback(async (query) => {
//     if (!query || !repoId) return;

//     setGlobalQueryText('');
//     setIsStreamingQuery(true);
//     setShowGlobalChat(true);   // Open chat panel
//     setShowAIPanel(false);      // Close file panel

//     try {
//       await streamGlobalQuery(repoId, query, (chunk) => {
//         setGlobalQueryText((prev) => prev + chunk);
//       });
//     } catch (err) {
//       setGlobalQueryText(`❌ Error: ${err.message}`);
//     } finally {
//       setIsStreamingQuery(false);
//     }
//   }, [repoId]);

//   const handleCloseQuery = useCallback(() => {
//     setGlobalQueryText('');
//     setIsStreamingQuery(false);
//     setShowGlobalChat(false);
//   }, []);

//   const handleCloseAI = useCallback(() => {
//     setShowAIPanel(false);
//     setSelectedNode(null);
//   }, []);

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//       className="h-screen w-screen flex flex-col overflow-hidden"
//       style={{ background: '#1E232E' }}
//     >
//       {/* Top Nav — fixed height bar */}
//       <div className="h-14 flex-shrink-0 w-full">
//         <TopNav repoUrl={repoUrlForNav} onSearch={handleGlobalSearch} />
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 flex overflow-hidden p-3 gap-3" style={{ minHeight: 0 }}>
//         {/* Left Sidebar — 20% */}
//         <div className="w-1/5 min-w-[240px] max-w-[320px] flex-shrink-0 relative z-20">
//           <div className="w-full h-full rounded-2xl p-4 overflow-hidden"
//                style={{
//                  background: '#1E232E',
//                  boxShadow: 'inset 4px 4px 10px #141820, inset -4px -4px 10px #283048'
//                }}>
//             <FileSidebar 
//               onSelectFile={handleFileSelect}
//               onSelectFolder={handleFolderSelect}
//               selectedFile={selectedNode} 
//               files={apiData?.file_tree || []}
//             />
//           </div>
//         </div>

//         {/* Center + Right */}
//         <div className="flex-1 flex gap-4 min-w-0 h-full">
//           {/* Center Column: Graph + Bottom Strip */}
//           <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
//             {/* Dependency Graph — Fills remaining space */}
//             <div className="flex-1 min-w-0">
//               <DependencyGraph
//                 onNodeClick={handleNodeClick}
//                 onMatrixCellClick={handleMatrixClick}
//                 apiData={apiData}
//                 currentFolder={currentFolder}
//                 onNavigateFolder={handleNavigateFolder}
//               />
//             </div>

//             {/* Bottom Onboarding Strip — 15% height */}
//             <div className="flex-shrink-0" style={{ height: '15%', minHeight: '120px' }}>
//               <OnboardingStrip 
//                 onSelectFile={handleNodeClick} 
//               />
//             </div>
//           </div>

//           {/* Sliding Right Panels — 25% when visible. */}
//           <AnimatePresence mode="wait">
//             {showAIPanel && (
//               <motion.div 
//                 key="ai-panel"
//                 initial={{ x: '100%', opacity: 0, width: 0 }}
//                 animate={{ x: 0, opacity: 1, width: '25%' }}
//                 exit={{ x: '100%', opacity: 0, width: 0 }}
//                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//                 className="min-w-[280px] max-w-[380px] flex-shrink-0 h-full overflow-hidden"
//               >
//                 <AIPanel
//                   selectedNode={selectedNode}
//                   repoId={apiData?.repo_id}
//                   onClose={handleCloseAI}
//                 />
//               </motion.div>
//             )}

//             {showGlobalChat && (
//               <motion.div 
//                 key="chat-panel"
//                 initial={{ x: '100%', opacity: 0, width: 0 }}
//                 animate={{ x: 0, opacity: 1, width: '25%' }}
//                 exit={{ x: '100%', opacity: 0, width: 0 }}
//                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//                 className="min-w-[280px] max-w-[380px] flex-shrink-0 h-full overflow-hidden"
//               >
//                 <GlobalChatPanel 
//                   queryText={globalQueryText}
//                   isStreaming={isStreamingQuery}
//                   onClose={handleCloseQuery}
//                 />
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </motion.div>
//   );
// }


import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopNav from './dashboard/TopNav';
import FileSidebar from './dashboard/FileSidebar';
import DependencyGraph from './dashboard/DependencyGraph';
import AIPanel from './dashboard/AIPanel';
import OnboardingStrip from './dashboard/OnboardingStrip';
import GlobalChatPanel from './dashboard/GlobalChatPanel';
import { streamGlobalQuery, fetchFileDetails, fetchOnboardingPath } from '../services/api';

export default function Dashboard({ apiData }) {
  const { repoId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!apiData && !repoId) navigate('/');
  }, [apiData, repoId, navigate]);

  const repoUrlForNav = apiData?.repo_id || repoId || '';

  const [selectedNode, setSelectedNode] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');

  // Global Query Streaming State
  const [globalQueryText, setGlobalQueryText] = useState('');
  const [isStreamingQuery, setIsStreamingQuery] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  // Onboarding strip state — updates on every node click
  const [onboardingCards, setOnboardingCards] = useState([]);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const handleNodeClick = useCallback(async (nodeId) => {
    if (!nodeId) return;
    const id = apiData?.repo_id || repoId;

    setSelectedNode(nodeId);
    setShowAIPanel(true);
    setShowGlobalChat(false);

    // Kick off onboarding strip update for this node
    setOnboardingLoading(true);
    setOnboardingCards([]);

    try {
      // 1. fetchFileDetails already returns onboarding_path (ego-scoped file list)
      const details = await fetchFileDetails(id, nodeId);
      const egoFilePaths = details?.onboarding_path || [];

      if (egoFilePaths.length > 0) {
        // 2. Send those paths to Groq to get human-readable cards
        const cards = await fetchOnboardingPath(id, egoFilePaths);
        setOnboardingCards(cards);
      }
    } catch (err) {
      console.error("❌ [Dashboard] Onboarding path fetch failed:", err);
      setOnboardingCards([]);
    } finally {
      setOnboardingLoading(false);
    }
  }, [apiData?.repo_id, repoId]);

  const handleMatrixClick = useCallback((cellData) => {
    setShowAIPanel(!!cellData);
    if (cellData) setShowGlobalChat(false);
  }, []);

  const handleFileSelect = useCallback((fileId) => {
    // Route through handleNodeClick so onboarding strip updates too
    handleNodeClick(fileId);
  }, [handleNodeClick]);

  const handleFolderSelect = useCallback((folderId) => {
    setCurrentFolder(folderId || '');
  }, []);

  const handleNavigateFolder = useCallback((path) => {
    setCurrentFolder(path || '');
  }, []);

  const handleGlobalSearch = useCallback(async (query) => {
    if (!query || !repoId) return;
    setGlobalQueryText('');
    setIsStreamingQuery(true);
    setShowGlobalChat(true);
    setShowAIPanel(false);

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
    setShowGlobalChat(false);
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
      <div className="h-14 flex-shrink-0 w-full">
        <TopNav repoUrl={repoUrlForNav} onSearch={handleGlobalSearch} />
      </div>

      <div className="flex-1 flex overflow-hidden p-3 gap-3" style={{ minHeight: 0 }}>
        {/* Left Sidebar */}
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
          <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
            {/* Dependency Graph */}
            <div className="flex-1 min-w-0">
              <DependencyGraph
                onNodeClick={handleNodeClick}
                onMatrixCellClick={handleMatrixClick}
                apiData={apiData}
                currentFolder={currentFolder}
                onNavigateFolder={handleNavigateFolder}
              />
            </div>

            {/* Onboarding Strip — reacts to clicked node */}
            <div className="flex-shrink-0" style={{ height: '15%', minHeight: '120px' }}>
              <OnboardingStrip 
                onSelectFile={handleNodeClick}
                cards={onboardingCards}
                loading={onboardingLoading}
              />
            </div>
          </div>

          {/* Sliding Right Panels */}
          <AnimatePresence mode="wait">
            {showAIPanel && (
              <motion.div 
                key="ai-panel"
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

            {showGlobalChat && (
              <motion.div 
                key="chat-panel"
                initial={{ x: '100%', opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: '25%' }}
                exit={{ x: '100%', opacity: 0, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="min-w-[280px] max-w-[380px] flex-shrink-0 h-full overflow-hidden"
              >
                <GlobalChatPanel 
                  queryText={globalQueryText}
                  isStreaming={isStreamingQuery}
                  onClose={handleCloseQuery}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}