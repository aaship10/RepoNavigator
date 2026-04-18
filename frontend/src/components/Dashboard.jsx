import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import TopNav from './dashboard/TopNav';
import FileSidebar from './dashboard/FileSidebar';
import DependencyGraph from './dashboard/DependencyGraph';
import AIPanel from './dashboard/AIPanel';
import OnboardingStrip from './dashboard/OnboardingStrip';

// Map file IDs to graph node IDs
const fileToNodeMap = {
  'src/components/App.tsx': 'app',
  'src/components/Header.tsx': 'header',
  'src/components/Sidebar.tsx': 'sidebar',
  'src/components/Dashboard.tsx': 'dashboard',
  'src/components/AuthGuard.tsx': 'useAuth',
  'src/components/Modal.tsx': 'modal',
  'src/components/OldBanner.tsx': 'old-banner',
  'src/hooks/useAuth.ts': 'useAuth',
  'src/hooks/useApi.ts': 'useApi',
  'src/hooks/useTheme.ts': 'useTheme',
  'src/services/api.ts': 'api',
  'src/services/auth.ts': 'auth-service',
  'src/services/analytics.ts': 'analytics',
  'src/services/legacy-logger.ts': 'legacy-logger',
  'src/utils/helpers.ts': 'helpers',
  'src/utils/constants.ts': 'constants',
  'src/utils/validators.ts': 'validators',
  'src/pages/Home.tsx': 'home',
  'src/pages/Login.tsx': 'login',
  'src/pages/Settings.tsx': 'settings',
  'src/pages/NotFound.tsx': 'notfound',
  'src/main.tsx': 'main',
  'server/index.ts': 'server-index',
  'server/routes.ts': 'routes',
  'server/middleware.ts': 'middleware',
  'server/db.ts': 'db',
};

export default function Dashboard({ repoUrl }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNode(nodeId);
    setShowAIPanel(true);
  }, []);

  const handleFileSelect = useCallback((fileId) => {
    const nodeId = fileToNodeMap[fileId] || null;
    if (nodeId) {
      setSelectedNode(nodeId);
      setShowAIPanel(true);
    }
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
          <FileSidebar onSelectFile={handleFileSelect} selectedFile={selectedNode} />
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
              />
            </div>

            {/* AI Panel — 25% when visible */}
            {showAIPanel && (
              <div className="w-1/4 min-w-[260px] max-w-[340px] flex-shrink-0">
                <AIPanel
                  selectedNode={selectedNode}
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
