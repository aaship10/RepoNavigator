import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, FileCode2, FileJson, FileText,
  FolderOpen, Folder, Search, Code2, Braces
} from 'lucide-react';
import { mockFileTree } from '../../data/mockData';

const iconMap = {
  react: <Code2 className="w-3.5 h-3.5 text-cyan-400 opacity-80" />,
  ts: <Braces className="w-3.5 h-3.5 text-indigo-400 opacity-80" />,
  hook: <FileCode2 className="w-3.5 h-3.5 text-purple-400 opacity-80" />,
  json: <FileJson className="w-3.5 h-3.5 text-amber-400 opacity-80" />,
  css: <FileText className="w-3.5 h-3.5 text-pink-400 opacity-80" />,
  md: <FileText className="w-3.5 h-3.5 text-slate-500 opacity-80" />,
};

const getIconForFile = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['js', 'jsx', 'tsx'].includes(ext)) return 'react';
  if (ext === 'ts') return 'ts';
  if (ext === 'json') return 'json';
  if (ext === 'css' || ext === 'scss') return 'css';
  if (['md', 'txt'].includes(ext)) return 'md';
  return 'default';
};

const buildFileTree = (paths) => {
  if (!paths || !Array.isArray(paths)) {
    console.warn("⚠️ [FileSidebar.jsx] buildFileTree received invalid paths:", paths);
    return [];
  }
  const root = [];
  
  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel = root;
    let currentId = '';

    parts.forEach((part, index) => {
      currentId = currentId ? `${currentId}/${part}` : part;
      const isLast = index === parts.length - 1;
      
      let existingChild = currentLevel.find(item => item.name === part);

      if (!existingChild) {
        existingChild = {
          id: currentId,
          name: part,
          type: isLast ? 'file' : 'folder',
          ...(isLast ? { 
            icon: getIconForFile(part),
            heat: ['red', 'yellow', 'blue', 'grey'][Math.floor(Math.random() * 4)]
          } : { children: [], expanded: true })
        };
        currentLevel.push(existingChild);
      }
      
      if (!isLast) {
        currentLevel = existingChild.children;
      }
    });
  });

  const sortItems = (items) => {
    return items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(item => {
      if (item.children) item.children = sortItems(item.children);
      return item;
    });
  };

  return sortItems(root);
};

const heatDotClass = {
  red: 'heat-dot heat-dot-red',
  yellow: 'heat-dot heat-dot-yellow',
  grey: 'heat-dot heat-dot-grey',
  hollow: 'heat-dot heat-dot-hollow',
  blue: 'heat-dot heat-dot-blue',
};

function TreeItem({ item, depth = 0, onSelectFile, onSelectFolder, selectedFile, filter }) {
  const [expanded, setExpanded] = useState(item.expanded ?? false);

  // Filter logic
  const matchesFilter = !filter || item.name.toLowerCase().includes(filter.toLowerCase());
  const hasMatchingChildren = (node) => {
    if (node.children) {
      return node.children.some(child => 
        child.name.toLowerCase().includes(filter.toLowerCase()) || hasMatchingChildren(child)
      );
    }
    return false;
  };

  const childrenMatch = hasMatchingChildren(item);

  if (filter && !matchesFilter && !childrenMatch) return null;

  const isFolder = item.type === 'folder';
  const isSelected = selectedFile === item.id;

  if (isFolder) {
    const shouldExpand = filter ? (childrenMatch || matchesFilter) : expanded;

    return (
      <div className="mb-0.5">
        <button
          onClick={() => { setExpanded(!expanded); if (onSelectFolder) onSelectFolder(item.id); }}
          className={`w-full flex items-center gap-2.5 py-1.5 px-3 rounded-xl text-[12px] transition-all duration-300 group hover:bg-white/5`}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {shouldExpand
              ? <ChevronDown className="w-3 h-3 text-gray-600 transition-transform" />
              : <ChevronRight className="w-3 h-3 text-gray-600 transition-transform" />
            }
          </div>
          <div className="relative">
            {shouldExpand
              ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
              : <Folder className="w-3.5 h-3.5 text-gray-600 opacity-70" />
            }
          </div>
          <span className={`truncate font-medium transition-colors ${shouldExpand ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-300'}`}>
            {item.name}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {shouldExpand && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-l border-white/5 ml-[18px]"
              style={{ marginLeft: `${depth * 14 + 19}px` }}
            >
              <div className="pt-0.5">
                {item.children.map(child => (
                  <TreeItem
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    onSelectFile={onSelectFile}
                    onSelectFolder={onSelectFolder}
                    selectedFile={selectedFile}
                    filter={filter}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // File item
  const heatColor = {
    red: '#F87171',
    yellow: '#FBBF24',
    blue: '#60A5FA',
    grey: '#4B5563',
  }[item.heat] || '#4B5563';

  return (
    <motion.button
      onClick={() => onSelectFile(item.id)}
      className={`w-full flex items-center gap-2.5 py-1.5 px-3 rounded-xl text-[12px] transition-all duration-300 group mb-0.5 ${isSelected
          ? 'bg-cyan-500/10'
          : 'hover:bg-white/5'
        }`}
      style={{
        paddingLeft: `${depth * 14 + 12}px`,
        boxShadow: isSelected ? 'inset 3px 3px 6px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.02)' : 'none',
        border: isSelected ? '1px solid rgba(34,211,238,0.1)' : '1px solid transparent',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
        {iconMap[item.icon] || <FileCode2 className="w-3.5 h-3.5 text-gray-600" />}
      </div>
      <span className={`truncate font-mono transition-colors ${isSelected ? 'text-cyan-400 font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {item.name}
      </span>
      <div className="ml-auto flex-shrink-0">
        <div 
          className="w-1.5 h-1.5 rounded-full" 
          style={{ 
            background: heatColor,
            boxShadow: `0 0 6px ${heatColor}88`,
            opacity: item.heat === 'grey' ? 0.3 : 1
          }} 
        />
      </div>
    </motion.button>
  );
}

export default function FileSidebar({ onSelectFile, onSelectFolder, selectedFile, files = [] }) {
  console.log("🗂️ [FileSidebar.jsx] Rendering with files prop:", files);
  const [filter, setFilter] = useState('');

  const fileTree = useMemo(() => {
    if (files.length > 0) {
      const tree = buildFileTree(files);
      console.log("🌲 [FileSidebar.jsx] Built File Tree:", tree);
      return tree;
    }
    return mockFileTree;
  }, [files]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: '#1A1F2B',
        boxShadow: 'inset 3px 3px 8px #141820, inset -3px -3px 8px #232939',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Explorer</h3>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30" />
        </div>
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-cyan-500/30"
          style={{
            background: '#141820',
            boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.02)',
          }}
        >
          <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          <input
            id="file-search-input"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search resources..."
            className="bg-transparent border-none outline-none text-[12px] text-gray-300 placeholder-gray-700 w-full font-mono"
          />
        </div>
      </div>

      {/* Heat Legend */}
      <div className="px-5 py-2 flex items-center gap-3.5 flex-wrap border-b border-white/5 pb-4 mx-1">
        {[
          { color: '#F87171', label: 'High' },
          { color: '#FBBF24', label: 'Med' },
          { color: '#60A5FA', label: 'Entry' },
          { color: '#9CA3AF', label: 'Low' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}88` }} />
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{l.label}</span>
          </div>
        ))}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {fileTree.map(item => (
          <TreeItem
            key={item.id}
            item={item}
            onSelectFile={onSelectFile}
            onSelectFolder={onSelectFolder}
            selectedFile={selectedFile}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}
