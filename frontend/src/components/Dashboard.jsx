import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import TopNav from './dashboard/TopNav';
import FileSidebar from './dashboard/FileSidebar';
import DependencyGraph from './dashboard/DependencyGraph';
import AIPanel from './dashboard/AIPanel';
import OnboardingStrip from './dashboard/OnboardingStrip';

export default function Dashboard({ repoUrl, apiData }) {
  console.log("🖥️ [Dashboard.jsx] Rendering with apiData:", apiData);
  console.log("📂 [Dashboard.jsx] Found files for sidebar:", apiData?.file_tree);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const handleNodeClick = useCallback((nodeId) => {
    console.log("👉 [Dashboard.jsx] Node clicked in graph:", nodeId);
    setSelectedNode(nodeId);
    setShowAIPanel(true);
  }, []);

  const handleFileSelect = useCallback((fileId) => {
    console.log("👉 [Dashboard.jsx] File selected in sidebar:", fileId);
    // Since the graph is now dynamically built from paths,
    // the fileId from the sidebar exactly matches the node ID in the graph.
    setSelectedNode(fileId);
    setShowAIPanel(true);
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
      {/* Top Nav — ~56px */}
      <div className="h-14 flex-shrink-0">
        <TopNav repoUrl={repoUrl} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3" style={{ minHeight: 0 }}>
        {/* Left Sidebar — 20% */}
        <div className="w-1/5 min-w-[220px] max-w-[300px] flex-shrink-0">
          <FileSidebar 
            onSelectFile={handleFileSelect} 
            selectedFile={selectedNode} 
            files={apiData?.file_tree || []}
          />
        </div>

        {/* Center + Right */}
        <div className="flex-1 flex flex-col gap-3 min-w-0" style={{ minHeight: 0 }}>
          {/* Center Graph + AI Panel */}
          <div className="flex-1 flex gap-3 min-h-0">
            {/* Dependency Graph — Fills remaining space */}
            <div className="flex-1 min-w-0">
              <DependencyGraph
                onNodeClick={handleNodeClick}
                selectedNode={selectedNode}
                files={apiData?.file_tree || []} // <-- Dynamic data passed here!
              />
            </div>

            {/* AI Panel — 25% when visible */}
            {showAIPanel && (
              <div className="w-1/4 min-w-[260px] max-w-[340px] flex-shrink-0">
                <AIPanel
                  selectedNode={selectedNode}
                  repoId={apiData?.repo_id}
                  onClose={handleCloseAI}
                />
              </div>
            )}
          </div>

          {/* Bottom Onboarding Strip — 15% height */}
          <div className="flex-shrink-0" style={{ height: '15%', minHeight: '120px' }}>
            <OnboardingStrip onSelectFile={handleNodeClick} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}