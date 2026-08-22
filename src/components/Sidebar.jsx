import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Search, 
  Clock, 
  Layers, 
  Globe, 
  FolderPlus, 
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Shield,
  User,
  LogOut,
  Key,
  Settings,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Sidebar({
  collections,
  onSelectRequest,
  activeRequestId,
  onCreateCollection,
  onCreateFolder,
  onCreateRequest,
  onDeleteNode,
  onRenameCollection,
  onRenameNode,
  onReorderCollections,
  history,
  onSelectHistoryItem,
  environments = [],
  activeEnvId,
  onSelectEnvironment,
  onOpenEnvModal,
  lang = 'es',
  isCollapsed = false,
  isMobileOpen,
  onCloseMobile,
  onToggleSidebarCollapse,
  expandedCollections = {},
  onToggleExpandCollection,
  currentUser,
  onOpenLoginModal,
  onLogout
}) {
  const t = translations[lang] || translations.es;
  const [activeSidebarTab, setActiveSidebarTab] = useState('collections');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedEnvs, setExpandedEnvs] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisibleSecrets, setSidebarVisibleSecrets] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isEnvSectionExpanded, setIsEnvSectionExpanded] = useState(true);
  const [editingNode, setEditingNode] = useState(null);

  const startRename = (id, name, type, collectionId = null) => {
    setEditingNode({ id, name, type, collectionId });
  };

  const cancelRename = () => {
    setEditingNode(null);
  };

  const submitRename = (id) => {
    if (!editingNode || editingNode.id !== id) return;
    const trimmed = editingNode.name.trim();
    if (trimmed) {
      if (editingNode.type === 'collection' && onRenameCollection) {
        onRenameCollection(id, trimmed);
      } else if (onRenameNode && editingNode.collectionId) {
        onRenameNode(editingNode.collectionId, id, trimmed);
      }
    }
    setEditingNode(null);
  };

  const toggleSidebarSecret = (key) => {
    setSidebarVisibleSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const toggleEnvExpand = (envId) => {
    setExpandedEnvs(prev => ({
      ...prev,
      [envId]: prev[envId] === false ? true : false
    }));
  };

  // Reorder Collections (Move Up / Move Down)
  const handleMoveCollection = (index, direction) => {
    const newCols = [...collections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;

    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;

    if (onReorderCollections) {
      onReorderCollections(newCols);
    }
  };

  // HTML5 Drag & Drop Reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newCols = [...collections];
    const [draggedItem] = newCols.splice(draggedIndex, 1);
    newCols.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);

    if (onReorderCollections) {
      onReorderCollections(newCols);
    }
  };

  const getMethodBadgeClass = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'method-badge-GET text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'POST': return 'method-badge-POST text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'PUT': return 'method-badge-PUT text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'DELETE': return 'method-badge-DELETE text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'PATCH': return 'method-badge-PATCH text-purple-400 bg-purple-500/10 border-purple-500/30';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  // Render Collection Items recursively
  const renderItems = (items, collectionId) => {
    if (!items) return null;

    return items
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((item) => {
        if (item.isFolder) {
          const isExpanded = expandedFolders[item.id] !== false;
          return (
            <div key={item.id} className="ml-2 my-0.5">
              <div 
                className="group flex items-center justify-between py-1.5 px-2 rounded hover:bg-dark-850 cursor-pointer text-slate-300 text-xs transition-colors"
                onClick={() => toggleFolder(item.id)}
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <Folder className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
                  {editingNode?.id === item.id ? (
                    <input
                      type="text"
                      value={editingNode.name}
                      onChange={(e) => setEditingNode(prev => ({ ...prev, name: e.target.value }))}
                      onBlur={() => submitRename(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(item.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="bg-dark-950 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full max-w-[120px]"
                    />
                  ) : (
                    <span 
                      className="truncate font-medium flex-1"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRename(item.id, item.name, 'folder', collectionId);
                      }}
                      title="Double-click to rename"
                    >
                      {item.name}
                    </span>
                  )}
                </div>

                <div className="hidden group-hover:flex items-center space-x-0.5 flex-shrink-0 bg-dark-850/90 pl-1 rounded">
                  <button
                    onClick={(e) => { e.stopPropagation(); startRename(item.id, item.name, 'folder', collectionId); }}
                    className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-brand-accent"
                    title={t.renameFolder || 'Rename Folder'}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCreateRequest(collectionId, item.id); }}
                    className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-emerald-400"
                    title={t.addRequest}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteNode(collectionId, item.id); }}
                    className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-rose-400"
                    title="Delete Folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="pl-2 border-l border-dark-800 ml-3">
                  {renderItems(item.items, collectionId)}
                </div>
              )}
            </div>
          );
        }

        // Request Item - Dynamic method badge derived directly from item.method
        const isActive = activeRequestId === item.id;
        const currentMethod = (item.method || 'GET').toUpperCase();

        return (
          <div
            key={item.id}
            onClick={() => {
              onSelectRequest(item);
              if (onCloseMobile) onCloseMobile();
            }}
            className={`group flex items-center justify-between py-1.5 px-2 rounded my-0.5 cursor-pointer text-xs transition-all ${
              isActive 
                ? 'bg-brand-500/15 border-l-2 border-brand-500 text-slate-100 font-semibold shadow-sm' 
                : 'hover:bg-dark-850 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1 mr-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono flex-shrink-0 ${getMethodBadgeClass(currentMethod)}`}>
                {currentMethod}
              </span>
              {editingNode?.id === item.id ? (
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode(prev => ({ ...prev, name: e.target.value }))}
                  onBlur={() => submitRename(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(item.id);
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="bg-dark-950 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                />
              ) : (
                <span 
                  className="truncate flex-1 text-slate-200"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(item.id, item.name, 'request', collectionId);
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>
              )}
            </div>

            <div className="hidden group-hover:flex items-center space-x-0.5 flex-shrink-0 bg-dark-850/90 pl-1 rounded">
              <button
                onClick={(e) => { e.stopPropagation(); startRename(item.id, item.name, 'request', collectionId); }}
                className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-brand-accent"
                title={t.renameRequest || 'Rename Request'}
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteNode(collectionId, item.id); }}
                className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-rose-400"
                title="Delete Request"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      });
  };

  const activeEnv = environments.find(e => e.id === activeEnvId);

  const sidebarContent = (
    <aside className="w-72 md:w-80 bg-dark-900 border-r border-dark-800 flex flex-col h-full z-10 flex-shrink-0 select-none">
      {/* Sidebar Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-dark-800 px-2 pt-2">
        <div className="flex items-center space-x-0.5 w-full">
          <button
            onClick={() => setActiveSidebarTab('collections')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSidebarTab === 'collections'
                ? 'border-brand-500 text-brand-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.collections}</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('history')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSidebarTab === 'history'
                ? 'border-brand-500 text-brand-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.history}</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('env')}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeSidebarTab === 'env'
                ? 'border-brand-500 text-brand-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.vars}</span>
          </button>
        </div>

        {/* Sidebar Collapse/Expand Button */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            className="hidden md:block p-1 text-slate-400 hover:text-slate-100 hover:bg-dark-850 rounded ml-1"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-brand-accent" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-1 text-slate-400 hover:text-white ml-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* TAB 1: COLLECTIONS */}
      {activeSidebarTab === 'collections' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Bar & Search */}
          <div className="p-2 border-b border-dark-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder={t.filterCollections}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.catalogs}</span>
              <button
                onClick={onCreateCollection}
                className="flex items-center space-x-1 text-xs text-brand-accent hover:text-brand-400 font-medium px-2 py-0.5 rounded hover:bg-dark-850 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addCollection}</span>
              </button>
            </div>
          </div>

          {/* Tree View List with Collapsible Environment Card & Collections */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
            {/* COLLAPSIBLE ENVIRONMENT MENU CARD (STYLE MATCHING COLLECTIONS) */}
            <div className="bg-dark-950/60 rounded-lg p-1.5 border border-brand-500/30 hover:border-brand-500/50 transition-all shadow-sm">
              <div 
                onClick={() => setIsEnvSectionExpanded(!isEnvSectionExpanded)}
                className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-dark-850 cursor-pointer text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  {isEnvSectionExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                  <Globe className="w-4 h-4 text-brand-accent flex-shrink-0" />
                  <span className="truncate">{t.environmentsTitle}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-accent border border-brand-500/30 truncate max-w-[110px]">
                    {activeEnv ? activeEnv.name : t.noEnv}
                  </span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onOpenEnvModal && onOpenEnvModal(); }}
                  className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-brand-accent transition-colors"
                  title={t.manageEnv}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Collapsible Content: Select Active Environment */}
              {isEnvSectionExpanded && (
                <div className="mt-1.5 pl-2 space-y-1 border-t border-dark-800/80 pt-1.5">
                  <div
                    onClick={() => onSelectEnvironment && onSelectEnvironment(null)}
                    className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer text-xs font-mono transition-colors ${
                      !activeEnvId 
                        ? 'bg-brand-500/20 text-brand-accent font-semibold border border-brand-500/30' 
                        : 'hover:bg-dark-850 text-slate-400'
                    }`}
                  >
                    <span>{t.noEnv}</span>
                    {!activeEnvId && <CheckCircle2 className="w-3 h-3 text-brand-accent" />}
                  </div>

                  {environments.map((env) => {
                    const isSelected = activeEnvId === env.id;
                    return (
                      <div
                        key={env.id}
                        onClick={() => onSelectEnvironment && onSelectEnvironment(env.id)}
                        className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer text-xs font-mono transition-colors ${
                          isSelected 
                            ? 'bg-brand-500/20 text-brand-accent font-semibold border border-brand-500/30' 
                            : 'hover:bg-dark-850 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{env.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-brand-accent flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLLECTIONS CARDS LIST */}
            {collections.map((collection, index) => {
              const isColExpanded = expandedCollections[collection.id] !== false;

              return (
                <div
                  key={collection.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-dark-950/40 rounded-lg p-1.5 border transition-all ${
                    draggedIndex === index
                      ? 'border-brand-500 opacity-50 bg-brand-500/10'
                      : 'border-dark-800/60 hover:border-dark-700'
                  }`}
                >
                  {/* Collapsible Collection Header with Drag Handle & Move Up/Down Controls */}
                  <div 
                    onClick={() => onToggleExpandCollection && onToggleExpandCollection(collection.id)}
                    className="group flex items-center justify-between py-1.5 px-2 rounded hover:bg-dark-850 cursor-pointer text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-1">
                      <div className="text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" title={t.dragToReorder || "Drag to reorder collection"}>
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      {isColExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <Layers className="w-4 h-4 text-brand-accent flex-shrink-0" />
                      {editingNode?.id === collection.id ? (
                        <input
                          type="text"
                          value={editingNode.name}
                          onChange={(e) => setEditingNode(prev => ({ ...prev, name: e.target.value }))}
                          onBlur={() => submitRename(collection.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(collection.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="bg-dark-950 border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white font-semibold focus:outline-none w-full"
                        />
                      ) : (
                        <span 
                          className="truncate flex-1 text-slate-200"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRename(collection.id, collection.name, 'collection');
                          }}
                          title={collection.name}
                        >
                          {collection.name}
                        </span>
                      )}
                    </div>

                    {/* Collection Actions (revealed smoothly on hover) */}
                    <div className="hidden group-hover:flex items-center space-x-0.5 flex-shrink-0 bg-dark-850/90 pl-1 rounded">
                      <div className="flex items-center space-x-0.5 mr-0.5">
                        <button
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); handleMoveCollection(index, 'up'); }}
                          className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title={t.moveUp || "Move Collection Up"}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={index === collections.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleMoveCollection(index, 'down'); }}
                          className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-white disabled:opacity-30"
                          title={t.moveDown || "Move Collection Down"}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(collection.id, collection.name, 'collection'); }}
                        className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-brand-accent"
                        title={t.renameCollection || 'Rename Collection'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCreateFolder(collection.id); }}
                        className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-amber-400"
                        title={t.addFolder}
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCreateRequest(collection.id); }}
                        className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-emerald-400"
                        title={t.addRequest}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteNode(collection.id, collection.id); }}
                        className="p-1 hover:bg-dark-700 rounded text-slate-400 hover:text-rose-400"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Render Collection Items when expanded */}
                  {isColExpanded && (
                    <div className="mt-1">
                      {renderItems(collection.items, collection.id)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeSidebarTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>{t.noHistory}</p>
              <p className="text-[10px] mt-1 text-slate-600">{t.noHistorySub}</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectHistoryItem(item);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-between p-2 rounded hover:bg-dark-850 cursor-pointer text-xs transition-colors border border-transparent hover:border-dark-800"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${getMethodBadgeClass(item.request.method)}`}>
                    {item.request.method}
                  </span>
                  <span className="truncate text-slate-300 font-mono text-[11px]">{item.request.url}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className={item.response.status >= 200 && item.response.status < 300 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                    {item.response.status}
                  </span>
                  <span className="font-mono text-slate-500">{item.response.time}ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ENVIRONMENT VARS (COLLAPSIBLE ENVIRONMENT CARDS) */}
      {activeSidebarTab === 'env' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t.environmentsTitle || 'Environments'}
            </span>
            <button
              onClick={onOpenEnvModal}
              className="text-xs text-brand-accent hover:text-brand-400 font-medium px-2 py-0.5 rounded hover:bg-dark-850 transition-colors flex items-center space-x-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t.manageEnv}</span>
            </button>
          </div>

          {environments.length === 0 ? (
            <p className="text-xs text-slate-500 p-2">{t.noActiveEnv}</p>
          ) : (
            environments.map((env) => {
              const isSelected = activeEnvId === env.id;
              const isEnvExpanded = expandedEnvs[env.id] !== false;

              return (
                <div
                  key={env.id}
                  className={`bg-dark-950/60 rounded-lg p-1.5 border transition-all ${
                    isSelected 
                      ? 'border-brand-500/50 bg-brand-500/5 shadow-sm' 
                      : 'border-dark-800/60 hover:border-dark-700'
                  }`}
                >
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => toggleEnvExpand(env.id)}
                    className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-dark-850 cursor-pointer text-slate-200 text-xs font-semibold"
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      {isEnvExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <Globe className="w-4 h-4 text-brand-accent flex-shrink-0" />
                      <span className="truncate">{env.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectEnvironment) onSelectEnvironment(isSelected ? null : env.id);
                        }}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-all ${
                          isSelected 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? (lang === 'es' ? 'Activo' : 'Active') : (lang === 'es' ? 'Activar' : 'Activate')}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Variables List */}
                  {isEnvExpanded && (
                    <div className="mt-1.5 pl-2 space-y-1.5 border-t border-dark-800/80 pt-1.5">
                      {env.variables && env.variables.length > 0 ? (
                        env.variables.map((v, i) => {
                          const secretKey = `${env.id}-${i}`;
                          const isSecret = Boolean(v.isSecret);
                          const isVisible = sidebarVisibleSecrets[secretKey];

                          return (
                            <div key={i} className="bg-dark-950 p-2 rounded border border-dark-800/80 text-xs">
                              <div className="flex items-center justify-between font-mono">
                                <div className="flex items-center space-x-1 min-w-0">
                                  {isSecret && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" title="Secret Variable" />}
                                  <span className="text-brand-accent font-semibold truncate">{`{{${v.key}}}`}</span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
                                  {isSecret && (
                                    <button
                                      onClick={() => toggleSidebarSecret(secretKey)}
                                      className="p-0.5 text-slate-400 hover:text-white rounded"
                                      title={isVisible ? "Hide Value" : "Show Value"}
                                    >
                                      {isVisible ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                                    </button>
                                  )}
                                  <span className={`text-[9px] px-1 rounded ${v.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {v.enabled ? 'On' : 'Off'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-slate-300 font-mono text-[11px] truncate mt-1">
                                {v.value ? (
                                  isSecret && !isVisible ? '••••••••••••••••' : v.value
                                ) : (
                                  <span className="italic text-slate-600">empty</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-slate-500 italic p-1">No variables defined in this environment.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SIDEBAR BOTTOM PANEL: STAFF USER PROFILE & LOG OUT */}
      <div className="p-3 border-t border-dark-800 bg-dark-950/80">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7.5 h-7.5 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-amber-400" />
                ) : (
                  <User className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate">{currentUser.name}</div>
                <div className="text-[9px] font-mono text-brand-accent uppercase font-bold flex items-center gap-1">
                  <span>{currentUser.role}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-normal">Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all ml-1 flex-shrink-0"
              title={t.logOut}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.logOut}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t.signInAdmin}</span>
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden when collapsed; component stays mounted for mobile drawer) */}
      {!isCollapsed && (
        <div className="hidden md:block h-full">
          {sidebarContent}
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative flex-1 max-w-xs w-full bg-dark-900 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
