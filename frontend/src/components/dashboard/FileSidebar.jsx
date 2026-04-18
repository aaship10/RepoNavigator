import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, FileCode2, FileJson, FileText,
  FolderOpen, Folder, Search, Code2, Braces
} from 'lucide-react';
import { mockFileTree } from '../../data/mockData';

const iconMap = {
  react: <Code2 className="w-4 h-4 text-accent-cyan" />,
  ts: <Braces className="w-4 h-4 text-blue-400" />,
  hook: <FileCode2 className="w-4 h-4 text-accent-magenta" />,
  json: <FileJson className="w-4 h-4 text-yellow-400" />,
  css: <FileText className="w-4 h-4 text-pink-400" />,
  md: <FileText className="w-4 h-4 text-text-muted" />,
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

function TreeItem({ item, depth = 0, onSelectFile, selectedFile, filter }) {
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
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-all duration-200 hover:bg-neu-highlight/50 group`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {shouldExpand
            ? <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          }
          {shouldExpand
            ? <FolderOpen className="w-4 h-4 text-accent-indigo flex-shrink-0" />
            : <Folder className="w-4 h-4 text-accent-indigo/60 flex-shrink-0" />
          }
          <span className="text-text-secondary group-hover:text-text-primary truncate">{item.name}</span>
        </button>
        <AnimatePresence>
          {shouldExpand && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children.map(child => (
                <TreeItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  onSelectFile={onSelectFile}
                  selectedFile={selectedFile}
                  filter={filter}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // File item
  return (
    <motion.button
      onClick={() => onSelectFile(item.id)}
      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-all duration-200 group ${isSelected
          ? 'bg-accent-indigo/10'
          : 'hover:bg-neu-highlight/50'
        }`}
      style={{
        paddingLeft: `${depth * 16 + 8}px`,
        boxShadow: isSelected ? 'inset 2px 2px 6px #141820, inset -2px -2px 6px #283048' : 'none',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex-shrink-0">{iconMap[item.icon] || <FileCode2 className="w-4 h-4 text-text-muted" />}</div>
      <span className={`truncate ${isSelected ? 'text-accent-cyan' : 'text-text-secondary group-hover:text-text-primary'}`}>
        {item.name}
      </span>
      <div className="ml-auto flex-shrink-0">
        <span className={heatDotClass[item.heat] || 'heat-dot heat-dot-grey'} />
      </div>
    </motion.button>
  );
}

export default function FileSidebar({ onSelectFile, selectedFile, files = [] }) {
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
        borderRadius: '16px',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Explorer</h3>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: '#1E232E',
            boxShadow: 'inset 2px 2px 6px #141820, inset -2px -2px 6px #283048',
          }}
        >
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            id="file-search-input"
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files..."
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-muted w-full"
          />
        </div>
      </div>

      {/* Heat Legend */}
      <div className="px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5"><span className="heat-dot heat-dot-red" /><span className="text-[10px] text-text-muted">High</span></div>
        <div className="flex items-center gap-1.5"><span className="heat-dot heat-dot-yellow" /><span className="text-[10px] text-text-muted">Med</span></div>
        <div className="flex items-center gap-1.5"><span className="heat-dot heat-dot-blue" /><span className="text-[10px] text-text-muted">Entry</span></div>
        <div className="flex items-center gap-1.5"><span className="heat-dot heat-dot-grey" /><span className="text-[10px] text-text-muted">Low</span></div>
        <div className="flex items-center gap-1.5"><span className="heat-dot heat-dot-hollow" /><span className="text-[10px] text-text-muted">Dead</span></div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {fileTree.map(item => (
          <TreeItem
            key={item.id}
            item={item}
            onSelectFile={onSelectFile}
            selectedFile={selectedFile}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}
