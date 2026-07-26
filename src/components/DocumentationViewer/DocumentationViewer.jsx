import React, { useState } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  Search, 
  Download, 
  Code, 
  Layers, 
  Folder, 
  CheckCircle2, 
  Share2,
  Globe,
  Flame,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { generateCodeSnippet } from '../../services/snippetGenerator';

export default function DocumentationViewer({ 
  collection, 
  onRunRequestInWorkspace, 
  onImportCollectionToWorkspace,
  onOpenWorkspaceApp,
  isStandalonePublic = false 
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('curl');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileEndpointsOpen, setIsMobileEndpointsOpen] = useState(false);

  if (!collection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-950 text-center">
        <BookOpen className="w-12 h-12 text-slate-500 mb-3" />
        <p className="text-sm font-semibold text-slate-400">No collection selected to view documentation.</p>
      </div>
    );
  }

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getMethodColor = (m) => {
    switch (m?.toUpperCase()) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'PUT': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  // Flatten all requests for document listing
  const extractRequests = (items, folderName = '') => {
    let reqs = [];
    if (!items) return reqs;

    items.forEach(item => {
      if (item.isFolder) {
        reqs = [...reqs, ...extractRequests(item.items, item.name)];
      } else {
        reqs.push({ ...item, folderName });
      }
    });
    return reqs;
  };

  const allRequests = extractRequests(collection.items);
  const filteredRequests = allRequests.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950 text-slate-100 overflow-hidden select-text">
      {/* Standalone Public Header or Embedded Workspace Header */}
      {isStandalonePublic ? (
        <div className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm z-20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20 flex-shrink-0">
              <div className="w-full h-full bg-dark-950 rounded-[7px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-brand-accent animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h1 className="font-bold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
                  Endpoint<span className="text-brand-accent">Sys</span> Public Docs
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  Live API Spec
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Public Documentation Portal</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs text-slate-200 hover:text-white transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-brand-accent" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Docs'}</span>
            </button>

            <button
              onClick={() => {
                if (onImportCollectionToWorkspace) {
                  onImportCollectionToWorkspace(collection);
                } else if (onOpenWorkspaceApp) {
                  onOpenWorkspaceApp();
                }
              }}
              className="flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
            >
              <span>Import & Run in EndpointSys</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20 flex-shrink-0">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-accent" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">{collection.name}</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                  Published Docs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                {collection.description || 'Complete API reference documentation and endpoint schemas.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <div className="flex items-center space-x-1.5 bg-dark-850 border border-dark-700 rounded-lg p-1 text-xs">
              <span className="text-slate-400 font-mono pl-2">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-brand-accent font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="curl" className="bg-dark-900 text-slate-200">cURL</option>
                <option value="fetch" className="bg-dark-900 text-slate-200">JavaScript (fetch)</option>
                <option value="python" className="bg-dark-900 text-slate-200">Python</option>
                <option value="axios" className="bg-dark-900 text-slate-200">Axios</option>
                <option value="go" className="bg-dark-900 text-slate-200">Go</option>
              </select>
            </div>

            {onImportCollectionToWorkspace && (
              <button
                onClick={() => onImportCollectionToWorkspace(collection)}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold rounded-lg shadow-lg shadow-brand-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Import to Workspace</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collection Title Banner for Standalone Public Portal */}
      {isStandalonePublic && (
        <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border-b border-dark-800 px-4 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-brand-accent" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">{collection.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {collection.description || 'Interactive API documentation reference. Use the code examples or import directly into EndpointSys to test endpoints.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-dark-950 border border-dark-800 rounded-lg p-1 text-xs">
            <span className="text-slate-400 font-mono pl-2">Code Format:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-brand-accent font-semibold focus:outline-none cursor-pointer pr-2"
            >
              <option value="curl" className="bg-dark-900 text-slate-200">cURL</option>
              <option value="fetch" className="bg-dark-900 text-slate-200">JavaScript (fetch)</option>
              <option value="python" className="bg-dark-900 text-slate-200">Python</option>
              <option value="axios" className="bg-dark-900 text-slate-200">Node Axios</option>
              <option value="go" className="bg-dark-900 text-slate-200">Go</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Documentation Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Navigation Header Bar (< md) */}
        <div className="md:hidden bg-dark-900 border-b border-dark-800 px-4 py-2.5 flex items-center justify-between z-10 flex-shrink-0">
          <button
            onClick={() => setIsMobileEndpointsOpen(!isMobileEndpointsOpen)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-200 bg-dark-850 px-3 py-1.5 rounded-lg border border-dark-700 w-full justify-between"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Layers className="w-4 h-4 text-brand-accent flex-shrink-0" />
              <span className="truncate">Endpoints ({filteredRequests.length})</span>
            </div>
            {isMobileEndpointsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Mobile Collapsible Drawer / Dropdown */}
        {isMobileEndpointsOpen && (
          <div className="md:hidden bg-dark-900 border-b border-dark-800 p-4 space-y-3 max-h-72 overflow-y-auto z-20 shadow-2xl flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              {filteredRequests.map((req) => (
                <a
                  key={req.id}
                  href={`#doc-item-${req.id}`}
                  onClick={() => setIsMobileEndpointsOpen(false)}
                  className="flex items-center justify-between p-2 rounded hover:bg-dark-850 text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border ${getMethodColor(req.method)}`}>
                      {req.method}
                    </span>
                    <span className="truncate text-slate-300 group-hover:text-white">{req.name}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Navigation Table of Contents Sidebar (Expanded vs Collapsed) */}
        {!isNavCollapsed ? (
          <div className="hidden md:block w-64 bg-dark-900 border-r border-dark-800 p-4 space-y-4 overflow-y-auto flex-shrink-0 transition-all duration-300 select-none">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Endpoints ({filteredRequests.length})
              </div>
              <button
                onClick={() => setIsNavCollapsed(true)}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-dark-850 rounded transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              {filteredRequests.map((req) => (
                <a
                  key={req.id}
                  href={`#doc-item-${req.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-dark-850 text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border ${getMethodColor(req.method)}`}>
                      {req.method}
                    </span>
                    <span className="truncate text-slate-300 group-hover:text-white">{req.name}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center w-14 bg-dark-900 border-r border-dark-800 py-4 px-2 space-y-3 overflow-y-auto flex-shrink-0 transition-all duration-300 select-none">
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="p-1.5 text-slate-400 hover:text-brand-accent hover:bg-dark-850 rounded transition-colors"
              title="Expand Endpoints Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-brand-accent" />
            </button>

            <div className="w-full h-px bg-dark-800 my-1" />

            {filteredRequests.map((req) => (
              <a
                key={req.id}
                href={`#doc-item-${req.id}`}
                title={`${req.method} ${req.name}`}
                className="p-1.5 rounded hover:bg-dark-850 transition-colors flex items-center justify-center group"
              >
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono border ${getMethodColor(req.method)}`}>
                  {req.method}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Documentation Items Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 sm:space-y-10 min-w-0">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No endpoints matched your search filter.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const snippet = generateCodeSnippet(req, selectedLanguage);

              return (
                <div 
                  key={req.id} 
                  id={`doc-item-${req.id}`}
                  className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full"
                >
                  {/* Endpoint Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-dark-800 pb-4 gap-3">
                    <div className="space-y-1 max-w-2xl min-w-0 w-full sm:w-auto">
                      {req.folderName && (
                        <div className="text-xs text-amber-400 font-semibold flex items-center space-x-1">
                          <Folder className="w-3.5 h-3.5" />
                          <span>{req.folderName}</span>
                        </div>
                      )}
                      <h3 className="text-base font-bold text-white tracking-tight break-words">{req.name}</h3>
                      {req.description && (
                        <p className="text-xs text-slate-400 leading-relaxed break-words">{req.description}</p>
                      )}

                      {/* Request URL Box */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center space-x-2 pt-2 min-w-0 w-full">
                        <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded border ${getMethodColor(req.method)}`}>
                          {req.method}
                        </span>
                        <code className="text-xs font-mono text-slate-200 bg-dark-950 px-3 py-1 rounded-lg border border-dark-800 flex-1 min-w-0 break-all overflow-x-auto">
                          {req.url}
                        </code>
                      </div>
                    </div>

                    {/* Run in Workspace Button */}
                    <button
                      onClick={() => {
                        if (onRunRequestInWorkspace) {
                          onRunRequestInWorkspace(req);
                        } else if (onOpenWorkspaceApp) {
                          onOpenWorkspaceApp();
                        }
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-dark-850 hover:bg-dark-800 border border-dark-700 hover:border-brand-500 text-xs text-slate-200 hover:text-white rounded-lg transition-all flex-shrink-0 self-start sm:self-auto"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Run Endpoint</span>
                    </button>
                  </div>

                  {/* Specs & Code Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                    {/* Left Specs */}
                    <div className="space-y-4 min-w-0">
                      {req.params && req.params.filter(p => p.enabled).length > 0 && (
                        <div className="space-y-2 min-w-0">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Query Parameters</div>
                          <div className="border border-dark-800 rounded-lg overflow-x-auto bg-dark-950 text-xs w-full">
                            <table className="w-full text-left font-mono min-w-[280px]">
                              <thead className="bg-dark-900 text-slate-400 text-[10px] uppercase">
                                <tr>
                                  <th className="py-2 px-3">Key</th>
                                  <th className="py-2 px-3">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-850">
                                {req.params.filter(p => p.enabled).map((p, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 px-3 text-brand-accent font-semibold break-all">{p.key}</td>
                                    <td className="py-1.5 px-3 text-slate-300 break-all">{p.value || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {req.headers && req.headers.filter(h => h.enabled).length > 0 && (
                        <div className="space-y-2 min-w-0">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Headers</div>
                          <div className="border border-dark-800 rounded-lg overflow-x-auto bg-dark-950 text-xs w-full">
                            <table className="w-full text-left font-mono min-w-[280px]">
                              <thead className="bg-dark-900 text-slate-400 text-[10px] uppercase">
                                <tr>
                                  <th className="py-2 px-3">Header</th>
                                  <th className="py-2 px-3">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-850">
                                {req.headers.filter(h => h.enabled).map((h, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 px-3 text-brand-accent font-semibold break-all">{h.key}</td>
                                    <td className="py-1.5 px-3 text-slate-300 break-all">{h.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {req.body && req.body.mode === 'raw' && req.body.rawContent && (
                        <div className="space-y-2 min-w-0">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                            Request Body ({req.body.rawType || 'json'})
                          </div>
                          <pre className="p-3 bg-dark-950 rounded-lg border border-dark-800 text-xs font-mono text-emerald-400 overflow-x-auto max-w-full">
                            {req.body.rawContent}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Executable Code Snippet */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                          Code Example ({selectedLanguage})
                        </span>
                        <button
                          onClick={() => handleCopyCode(req.id, snippet)}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-dark-950 px-2 py-1 rounded border border-dark-800 transition-colors"
                        >
                          {copiedId === req.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === req.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="bg-dark-950 border border-dark-800 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-w-full">
                        <pre className="overflow-x-auto">{snippet}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
