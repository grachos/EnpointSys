import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TabManager from './components/TabManager';
import RequestBuilder from './components/RequestBuilder/RequestBuilder';
import ResponseViewer from './components/ResponseViewer/ResponseViewer';
import LoginScreen from './components/LoginScreen';

const DocumentationViewer = lazy(() => import('./components/DocumentationViewer/DocumentationViewer'));
const EnvironmentModal = lazy(() => import('./components/Modals/EnvironmentModal'));
const ImportExportModal = lazy(() => import('./components/Modals/ImportExportModal'));
const CodeSnippetModal = lazy(() => import('./components/Modals/CodeSnippetModal'));
const PublishDocsModal = lazy(() => import('./components/Modals/PublishDocsModal'));
const LoginModal = lazy(() => import('./components/Modals/LoginModal'));
const ChangePasswordModal = lazy(() => import('./components/Modals/ChangePasswordModal'));

import { DEFAULT_ENVIRONMENTS, DEFAULT_COLLECTIONS, INITIAL_REQUEST } from './types/defaults';
import { executeHttpRequest } from './services/httpExecutor';
import { executeTestScript } from './services/scriptExecutor';
import { applyTheme, listenSystemThemeChange } from './services/themeService';
import {
  checkMySQLHealth,
  getAllCollectionsDB,
  saveCollectionsDB,
  getAllEnvironmentsDB,
  saveEnvironmentsDB,
  getHistoryDB,
  saveHistoryListDB,
  getPreferenceDB,
  setPreferenceDB,
  fetchCurrentUser,
  changePassword,
  getPublicDoc
} from './services/dbService';
import { setUnauthorizedHandler, clearAuthSession, getAuthToken, getStoredUser, setAuthSession } from './services/api';
import { GripHorizontal, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function App() {
  // DB Loaded state
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // JWT Staff Auth State
  const [authToken, setAuthToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [mustChangePassword, setMustChangePassword] = useState(() => !!getStoredUser()?.mustChangePassword);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Language & Theme State (Default: Spanish 'es')
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState('dark');

  // Panel Split Mode (Vertical = Top/Bottom, Horizontal = Left/Right) & Resizable Panel Ratio (%)
  const [splitMode, setSplitMode] = useState('vertical');
  const [panelRatio, setPanelRatio] = useState(50);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const containerRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 2. Collections, Environments, History & Active Env
  const [collections, setCollections] = useState([]);
  const [expandedCollections, setExpandedCollections] = useState({});
  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState(null);
  const [history, setHistory] = useState([]);

  // 3. View Mode & Tabs State
  const [isPublicDocUrl] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return Boolean(p.get('doc') && p.get('token'));
    } catch { return false; }
  });
  const [viewMode, setViewMode] = useState(() => isPublicDocUrl ? 'docs' : 'workspace');
  const [selectedDocCollectionId, setSelectedDocCollectionId] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('doc') || null;
    } catch { return null; }
  });
  const [isStandalonePublic, setIsStandalonePublic] = useState(isPublicDocUrl);

  const [tabs, setTabs] = useState([
    { id: 'tab-1', request: { ...INITIAL_REQUEST } }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Response & Execution State per Tab
  const [responses, setResponses] = useState({});
  const [testResultsMap, setTestResultsMap] = useState({});
  const [logsMap, setLogsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 5. Modals State
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [importExportState, setImportExportState] = useState({ isOpen: false, mode: 'import' });
  const [isCodeSnippetModalOpen, setIsCodeSnippetModalOpen] = useState(false);
  const [isPublishDocsModalOpen, setIsPublishDocsModalOpen] = useState(false);

  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  const requireAuthThen = (actionCallback) => {
    const token = getAuthToken();
    const savedUser = getStoredUser();
    const isSessionActive = Boolean(currentUser || (token && savedUser));

    if (!isSessionActive) {
      setPendingAuthAction(() => actionCallback);
      setIsLoginModalOpen(true);
    } else {
      if (!currentUser && savedUser) setCurrentUser(savedUser);
      actionCallback();
    }
  };

  const handleLoginSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
    setAuthSession(token, user);
    setMustChangePassword(!!user?.mustChangePassword);
    setIsLoginModalOpen(false);
    if (user?.mustChangePassword) setIsChangePasswordOpen(true);

    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setMustChangePassword(false);
    setPendingAuthAction(null);
    setIsLoginModalOpen(false);
    clearAuthSession();
    setIsStandalonePublic(false);
    setViewMode('workspace');
  };

  const handlePasswordChanged = () => {
    const updated = { ...currentUser, mustChangePassword: false };
    setCurrentUser(updated);
    setMustChangePassword(false);
    setAuthSession(getAuthToken(), updated);
    setIsChangePasswordOpen(false);
  };

  // Register a global 401 handler so any expired/invalid token clears the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setCurrentUser(null);
      setMustChangePassword(false);
      setIsLoginModalOpen(false);
      // Don't clobber a standalone public-docs view when a stale token clears.
      if (!isStandalonePublic) {
        setIsStandalonePublic(false);
        setViewMode('workspace');
      }
    });
  }, [isStandalonePublic]);

  // INITIAL DATABASE LOAD (parallelised) + standalone public-doc routing
  useEffect(() => {
    async function loadDatabaseData() {
      try {
        // Standalone public documentation link: ?doc=<id>&token=<signed>
        const urlParams = new URLSearchParams(window.location.search);
        const docParam = urlParams.get('doc');
        const docToken = urlParams.get('token');
        if (docParam && docToken) {
          const pub = await getPublicDoc(docParam, docToken);
          if (pub) {
            setCollections([pub]);
            setSelectedDocCollectionId(pub.id);
            setIsStandalonePublic(true);
            setViewMode('docs');
            setIsDbLoaded(true);
            return;
          }
          // invalid token -> fall through to normal auth-gated flow
        }

        if (!getAuthToken()) {
          setCollections(DEFAULT_COLLECTIONS);
          setEnvironments(DEFAULT_ENVIRONMENTS);
          setActiveEnvId(DEFAULT_ENVIRONMENTS[0]?.id);
          setIsDbLoaded(true);
          return;
        }

        // Refresh user flags (e.g. mustChangePassword) from the server.
        const me = await fetchCurrentUser().catch(() => null);
        if (me) {
          setCurrentUser(me);
          setAuthSession(getAuthToken(), me);
          setMustChangePassword(!!me.mustChangePassword);
          if (me.mustChangePassword) setIsChangePasswordOpen(true);
        }

        const ok = await checkMySQLHealth();
        if (!ok) throw new Error('backend unreachable');

        // Fire all independent reads in parallel to cut startup latency.
        const [cols, storedExpanded, envs, hist, storedLang, storedTheme, storedSplit, storedTabs] = await Promise.all([
          getAllCollectionsDB(),
          getPreferenceDB('expandedCollections', {}),
          getAllEnvironmentsDB(),
          getHistoryDB(),
          getPreferenceDB('lang', 'es'),
          getPreferenceDB('theme', 'dark'),
          getPreferenceDB('splitMode', 'vertical'),
          getPreferenceDB('tabs', null)
        ]);

        const finalCols = (!cols || cols.length === 0) ? DEFAULT_COLLECTIONS : cols;
        if (!cols || cols.length === 0) saveCollectionsDB(DEFAULT_COLLECTIONS);
        setCollections(finalCols);
        setExpandedCollections(storedExpanded || {});

        const finalEnvs = (!envs || envs.length === 0) ? DEFAULT_ENVIRONMENTS : envs;
        if (!envs || envs.length === 0) saveEnvironmentsDB(DEFAULT_ENVIRONMENTS);
        setEnvironments(finalEnvs);

        const envIdPref = await getPreferenceDB('activeEnvId', finalEnvs[0]?.id || null);
        setActiveEnvId(envIdPref);
        setHistory(hist || []);
        setLang(storedLang || 'es');
        setTheme(storedTheme || 'dark');
        applyTheme(storedTheme || 'dark');
        setSplitMode(storedSplit || 'vertical');
        if (storedTabs && storedTabs.length > 0) {
          setTabs(storedTabs);
          setActiveTabId(storedTabs[0].id);
        }

        setIsDbLoaded(true);
      } catch (err) {
        console.error('DB load fallback:', err);
        setCollections(DEFAULT_COLLECTIONS);
        setEnvironments(DEFAULT_ENVIRONMENTS);
        setActiveEnvId(DEFAULT_ENVIRONMENTS[0]?.id);
        setIsDbLoaded(true);
      }
    }

    loadDatabaseData();
  }, []);

  // PERSIST TO DATABASE (debounced to avoid save storms from rapid state changes)
  const saveTimers = useRef({});
  const debouncedSave = (key, fn, ms = 800) => {
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      try { fn(); } catch (e) { console.error('persist', key, e); }
    }, ms);
  };

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && collections && collections.length > 0) {
      debouncedSave('collections', () => saveCollectionsDB(collections));
    }
  }, [collections, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && expandedCollections) {
      debouncedSave('expandedCollections', () => setPreferenceDB('expandedCollections', expandedCollections), 400);
    }
  }, [expandedCollections, isDbLoaded, isStandalonePublic]);

  const handleToggleExpandCollection = (colId) => {
    setExpandedCollections(prev => {
      const isCurrentlyExpanded = prev[colId] !== false;
      return {
        ...prev,
        [colId]: !isCurrentlyExpanded
      };
    });
  };

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && environments && environments.length > 0) {
      debouncedSave('environments', () => saveEnvironmentsDB(environments));
    }
  }, [environments, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && activeEnvId) {
      debouncedSave('activeEnvId', () => setPreferenceDB('activeEnvId', activeEnvId), 400);
    }
  }, [activeEnvId, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && history) {
      debouncedSave('history', () => saveHistoryListDB(history));
    }
  }, [history, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && lang) {
      debouncedSave('lang', () => setPreferenceDB('lang', lang), 400);
    }
  }, [lang, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && theme) {
      applyTheme(theme);
      if (!isStandalonePublic) debouncedSave('theme', () => setPreferenceDB('theme', theme), 400);
    }
  }, [theme, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && splitMode) {
      debouncedSave('splitMode', () => setPreferenceDB('splitMode', splitMode), 400);
    }
  }, [splitMode, isDbLoaded, isStandalonePublic]);

  useEffect(() => {
    if (isDbLoaded && !isStandalonePublic && tabs) {
      debouncedSave('tabs', () => setPreferenceDB('tabs', tabs));
    }
  }, [tabs, isDbLoaded]);

  // Listen to OS system theme changes if theme === 'system'
  useEffect(() => {
    if (theme === 'system') {
      const cleanup = listenSystemThemeChange(() => {
        applyTheme('system');
      });
      return cleanup;
    }
  }, [theme]);

  // Mouse drag handling for Panel Splitter
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSplitter || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio;
      if (splitMode === 'vertical') {
        newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      }
      if (newRatio >= 5 && newRatio <= 95) {
        setPanelRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter, splitMode]);

  // Active Tab & Request Helper
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const activeRequest = activeTab?.request;
  const activeEnvironment = environments.find(e => e.id === activeEnvId);

  // Selected Published Doc Collection
  const activeDocCollection = collections.find(c => c.id === selectedDocCollectionId) || collections[0];

  // TAB ACTIONS
  const handleSelectTab = (tabId) => {
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabId) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter(t => t.id !== tabId);
    setTabs(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const handleNewTab = (req = null) => {
    const newTabId = 'tab-' + Date.now();
    const newReq = req ? JSON.parse(JSON.stringify(req)) : { ...INITIAL_REQUEST, id: 'req-' + Date.now() };
    setTabs(prev => [...prev, { id: newTabId, request: newReq }]);
    setActiveTabId(newTabId);
    setIsStandalonePublic(false);
    setViewMode('workspace');
  };

  // LIVE REQUEST UPDATE & COLLECTION METHOD SYNC FIX
  const handleUpdateRequest = (updatedRequest) => {
    // 1. Update Tab state
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, request: updatedRequest } : t));

    // 2. Sync changes back to collections hierarchy so sidebar method badge updates live!
    if (updatedRequest.id) {
      setCollections(prevCollections => {
        const updateItemsRecursively = (items) => {
          return items.map(item => {
            if (item.id === updatedRequest.id) {
              return { ...item, ...updatedRequest };
            }
            if (item.isFolder && item.items) {
              return { ...item, items: updateItemsRecursively(item.items) };
            }
            return item;
          });
        };

        return prevCollections.map(col => ({
          ...col,
          items: updateItemsRecursively(col.items || [])
        }));
      });
    }
  };

  // Switch from Public Portal Doc to Main Testing Workspace
  const handleTransitionToWorkspaceApp = () => {
    window.history.pushState({}, document.title, window.location.pathname);
    setIsStandalonePublic(false);
    setViewMode('workspace');
  };

  // COLLECTION & TREE ACTIONS
  const handleSelectRequestFromTree = (requestItem) => {
    const existingTab = tabs.find(t => t.request.id === requestItem.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      handleNewTab(requestItem);
    }
    setIsStandalonePublic(false);
    setViewMode('workspace');
  };

  const handleCreateCollection = () => {
    const name = prompt('Enter new Collection name:', 'New Collection');
    if (!name) return;
    const newCol = {
      id: 'col-' + Date.now(),
      name,
      description: '',
      items: []
    };
    setCollections(prev => [...prev, newCol]);
  };

  const handleCreateFolder = (collectionId) => {
    const name = prompt('Enter new Folder name:', 'New Folder');
    if (!name) return;

    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          items: [
            ...col.items,
            { id: 'folder-' + Date.now(), name, isFolder: true, items: [] }
          ]
        };
      }
      return col;
    }));
  };

  const handleCreateRequest = (collectionId, folderId = null) => {
    const name = prompt('Enter Request name:', 'New Request');
    if (!name) return;

    const newReq = {
      ...INITIAL_REQUEST,
      id: 'req-' + Date.now(),
      name,
      url: '{{baseUrl}}/posts'
    };

    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        if (!folderId) {
          return { ...col, items: [...col.items, newReq] };
        } else {
          const updateFolder = (items) => {
            return items.map(item => {
              if (item.id === folderId && item.isFolder) {
                return { ...item, items: [...item.items, newReq] };
              }
              if (item.isFolder && item.items) {
                return { ...item, items: updateFolder(item.items) };
              }
              return item;
            });
          };
          return { ...col, items: updateFolder(col.items) };
        }
      }
      return col;
    }));

    handleNewTab(newReq);
  };

  const handleDeleteNode = (collectionId, nodeId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setCollections(prev => {
      if (collectionId === nodeId) {
        return prev.filter(c => c.id !== collectionId);
      }

      return prev.map(col => {
        if (col.id === collectionId) {
          const filterItems = (items) => {
            return items.filter(item => {
              if (item.id === nodeId) return false;
              if (item.isFolder && item.items) {
                item.items = filterItems(item.items);
              }
              return true;
            });
          };
          return { ...col, items: filterItems(col.items) };
        }
        return col;
      });
    });
  };

  const handleTogglePublishCollection = (colId, publishData) => {
    setCollections(prevCols => {
      const newCols = prevCols.map(c => {
        if (c.id === colId) {
          return {
            ...c,
            isPublished: publishData.isPublished,
            publishedAt: publishData.publishedAt,
            pubToken: publishData.pubToken
          };
        }
        return c;
      });
      saveCollectionsDB(newCols);
      return newCols;
    });
  };

  const handleImportCollection = (importedCollection) => {
    const exists = collections.some(c => c.id === importedCollection.id || c.name === importedCollection.name);
    if (!exists) {
      setCollections(prev => [importedCollection, ...prev]);
    }
    if (importedCollection.items?.[0]) {
      handleSelectRequestFromTree(importedCollection.items[0]);
    }
  };

  // HTTP SEND EXECUTION
  const handleSendRequest = async () => {
    if (!activeRequest) return;

    setIsLoading(true);

    let envState = activeEnvironment ? JSON.parse(JSON.stringify(activeEnvironment)) : null;
    let isEnvModified = false;

    const setEnvVar = (key, val) => {
      if (!envState) return;
      isEnvModified = true;
      const existing = envState.variables.find(v => v.key === key);
      if (existing) {
        existing.value = val;
      } else {
        envState.variables.push({ key, value: val, enabled: true, isSecret: false });
      }
    };

    if (activeRequest.scripts?.preRequest) {
      executeTestScript(activeRequest.scripts.preRequest, {}, envState, setEnvVar);
    }

    const response = await executeHttpRequest(activeRequest, envState || activeEnvironment);

    let testResults = [];
    let logs = [];
    if (activeRequest.scripts?.test) {
      const scriptRes = executeTestScript(activeRequest.scripts.test, response, envState || activeEnvironment, setEnvVar);
      testResults = scriptRes.testResults;
      logs = scriptRes.logs;
    }

    // Persist script-set environment variables back to React state and XAMPP MySQL database!
    if (isEnvModified && envState) {
      setEnvironments(prevEnvs => {
        return prevEnvs.map(e => e.id === envState.id ? envState : e);
      });
    }

    setResponses(prev => ({ ...prev, [activeTabId]: response }));
    setTestResultsMap(prev => ({ ...prev, [activeTabId]: testResults }));
    setLogsMap(prev => ({ ...prev, [activeTabId]: logs }));
    setIsLoading(false);

    setHistory(prev => [
      {
        id: 'hist-' + Date.now(),
        timestamp: new Date().toISOString(),
        request: JSON.parse(JSON.stringify(activeRequest)),
        response: {
          status: response.status,
          statusText: response.statusText,
          time: response.time,
          size: response.size
        }
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleSelectHistoryItem = (historyItem) => {
    handleNewTab(historyItem.request);
  };

  // Platform Lock: Enforce LoginScreen authentication when unauthenticated.
  // A standalone public-docs visit (?doc=&token=) NEVER shows the login screen,
  // even before async state settles — we read the URL directly as a fail-safe.
  const hasActiveSession = Boolean(authToken && (currentUser || getStoredUser()));
  const isPublicDocVisit = (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return Boolean(p.get('doc') && p.get('token'));
    } catch { return false; }
  })();

  if (!hasActiveSession && !isStandalonePublic && !isPublicDocVisit) {
    if (!isDbLoaded) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-dark-950 text-slate-500 text-xs">
          <div className="animate-pulse">Loading EndpointSys…</div>
        </div>
      );
    }
    return <LoginScreen onLoginSuccess={handleLoginSuccess} initialLang={lang} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Header */}
      {!isStandalonePublic && (
        <Header
          environments={environments}
          activeEnvId={activeEnvId}
          onSelectEnvironment={setActiveEnvId}
          onOpenEnvModal={() => setIsEnvModalOpen(true)}
          onOpenImportExportModal={(mode) => setImportExportState({ isOpen: true, mode })}
          onOpenCodeSnippetModal={() => setIsCodeSnippetModalOpen(true)}
          onOpenPublishDocsModal={() => setIsPublishDocsModalOpen(true)}
          activeTabRequest={activeRequest}
          onToggleViewMode={(mode) => {
            if (mode === 'workspace') {
              requireAuthThen(() => setViewMode('workspace'));
            } else {
              setViewMode(mode);
            }
          }}
          lang={lang}
          onToggleLang={setLang}
          theme={theme}
          onToggleTheme={setTheme}
          splitMode={splitMode}
          onToggleSplitMode={setSplitMode}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Workspace vs Documentation Reader */}
      {viewMode === 'docs' ? (
        <Suspense fallback={null}>
        <DocumentationViewer
          collection={activeDocCollection}
          onRunRequestInWorkspace={(req) => {
            requireAuthThen(() => {
              setIsStandalonePublic(false);
              setViewMode('workspace');
              handleNewTab(req);
            });
          }}
          onImportCollectionToWorkspace={(importedCol) => {
            requireAuthThen(() => {
              setIsStandalonePublic(false);
              setViewMode('workspace');
              handleImportCollection(importedCol);
            });
          }}
          onOpenWorkspaceApp={() => {
            requireAuthThen(() => {
              setIsStandalonePublic(false);
              setViewMode('workspace');
            });
          }}
          isStandalonePublic={isStandalonePublic}
        />
        </Suspense>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (Desktop Collapsible) */}
          {!isSidebarCollapsed && (
            <Sidebar
              collections={collections}
              activeRequestId={activeRequest?.id}
              onSelectRequest={handleSelectRequestFromTree}
              onCreateCollection={handleCreateCollection}
              onCreateFolder={handleCreateFolder}
              onCreateRequest={handleCreateRequest}
              onDeleteNode={handleDeleteNode}
              onReorderCollections={setCollections}
              history={history}
              onSelectHistoryItem={handleSelectHistoryItem}
              environments={environments}
              activeEnvId={activeEnvId}
              onSelectEnvironment={setActiveEnvId}
              onOpenEnvModal={() => setIsEnvModalOpen(true)}
              lang={lang}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onToggleSidebarCollapse={() => setIsSidebarCollapsed(true)}
              expandedCollections={expandedCollections}
              onToggleExpandCollection={handleToggleExpandCollection}
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {/* Center Main Work Area */}
          <main className="flex-1 flex flex-col overflow-hidden bg-dark-950">
            {/* Open Tabs Manager */}
            <TabManager
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onNewTab={() => handleNewTab()}
            />

            {/* Flexible / Resizable Split Container */}
            <div 
              ref={containerRef}
              className={`flex-1 flex overflow-hidden relative ${splitMode === 'vertical' ? 'flex-col' : 'flex-row'}`}
            >
              {/* Panel 1: Request Builder */}
              {panelRatio > 2 && (
                <div 
                  style={{
                    [splitMode === 'vertical' ? 'height' : 'width']: `${panelRatio}%`
                  }}
                  className="flex flex-col overflow-hidden transition-all duration-75"
                >
                  <RequestBuilder
                    request={activeRequest}
                    onChange={handleUpdateRequest}
                    onSend={handleSendRequest}
                    onSave={() => alert('Request configuration saved permanently to XAMPP MySQL database!')}
                    isLoading={isLoading}
                    activeEnvironment={activeEnvironment}
                    lang={lang}
                  />
                </div>
              )}

              {/* Draggable Resizer Bar with Tiny Panel Action Icons */}
              <div
                onMouseDown={() => setIsDraggingSplitter(true)}
                className={`z-20 flex items-center justify-center bg-dark-800 hover:bg-brand-500/50 transition-colors cursor-pointer select-none relative group ${
                  splitMode === 'vertical' 
                    ? 'h-3.5 w-full cursor-row-resize border-y border-dark-700' 
                    : 'w-3.5 h-full cursor-col-resize border-x border-dark-700'
                }`}
                title="Drag to resize panels"
              >
                <div className={`flex items-center space-x-1 ${splitMode === 'vertical' ? 'flex-row' : 'flex-col space-y-1 space-x-0'}`}>
                  {/* Tiny Quick Panel Action Buttons */}
                  {splitMode === 'vertical' ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(96); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Maximize Request Builder (Collapse Response)"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(50); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Reset 50/50 Split"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(4); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Maximize Response Inspector (Collapse Request)"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(96); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Maximize Left Panel"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(50); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Reset 50/50 Split"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPanelRatio(4); }}
                        className="p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-white"
                        title="Maximize Right Panel"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Panel 2: Response Inspector */}
              {panelRatio < 98 && (
                <div 
                  style={{
                    [splitMode === 'vertical' ? 'height' : 'width']: `${100 - panelRatio}%`
                  }}
                  className="flex flex-col overflow-hidden transition-all duration-75"
                >
                  <ResponseViewer
                    response={responses[activeTabId]}
                    testResults={testResultsMap[activeTabId]}
                    logs={logsMap[activeTabId]}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* MODALS (lazy-loaded & only mounted when opened) */}
      <Suspense fallback={null}>
        {isEnvModalOpen && (
          <EnvironmentModal
            isOpen={isEnvModalOpen}
            onClose={() => setIsEnvModalOpen(false)}
            environments={environments}
            onSaveEnvironments={setEnvironments}
          />
        )}

        {importExportState.isOpen && (
          <ImportExportModal
            isOpen={importExportState.isOpen}
            mode={importExportState.mode}
            onClose={() => setImportExportState({ isOpen: false, mode: 'import' })}
            collections={collections}
            onImportCollection={handleImportCollection}
          />
        )}

        {isCodeSnippetModalOpen && (
          <CodeSnippetModal
            isOpen={isCodeSnippetModalOpen}
            onClose={() => setIsCodeSnippetModalOpen(false)}
            request={activeRequest}
          />
        )}

        {isPublishDocsModalOpen && (
          <PublishDocsModal
            isOpen={isPublishDocsModalOpen}
            onClose={() => setIsPublishDocsModalOpen(false)}
            collections={collections}
            onViewDocumentation={(col) => {
              setSelectedDocCollectionId(col.id);
              setViewMode('docs');
            }}
            onTogglePublishCollection={handleTogglePublishCollection}
            lang={lang}
          />
        )}

        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            lang={lang}
          />
        )}

        {(isChangePasswordOpen || mustChangePassword) && (
          <ChangePasswordModal
            isOpen={isChangePasswordOpen || mustChangePassword}
            onClose={() => { if (!mustChangePassword) setIsChangePasswordOpen(false); }}
            onChanged={handlePasswordChanged}
            username={currentUser?.username}
            lang={lang}
          />
        )}
      </Suspense>
    </div>
  );
}
