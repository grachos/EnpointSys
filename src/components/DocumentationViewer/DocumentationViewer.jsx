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
  Sparkles
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

  if (!collection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-950 text-center">
        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300">No collection selected to view documentation.</p>
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
        <div className="bg-dark-900 border-b border-dark-800 px-6 py-3 flex items-center justify-between shadow-xl z-20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-dark-950 rounded-[7px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-brand-accent animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  Endpoint<span className="text-brand-accent">Sys</span> Public Docs
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  Live API Spec
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Public Documentation Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs text-slate-300 hover:text-white transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-brand-accent" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Docs'}</span>
            </button>

            <button
              onClick={() => {
                if (onImportCollectionToWorkspace) {
                  onImportCollectionToWorkspace(collection);
                }
                if (onOpenWorkspaceApp) {
                  onOpenWorkspaceApp();
                }
              }}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all"
            >
              <span>Import & Run in EndpointSys</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-900 border-b border-dark-800 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-accent p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-accent" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">{collection.name}</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  Published Docs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {collection.description || 'Complete API reference documentation and endpoint schemas.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-dark-850 border border-dark-700 rounded-lg p-1 text-xs">
              <span className="text-slate-400 font-mono pl-2">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-brand-accent font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="curl" className="bg-dark-900 text-white">cURL</option>
                <option value="fetch" className="bg-dark-900 text-white">JavaScript (fetch)</option>
                <option value="python" className="bg-dark-900 text-white">Python</option>
                <option value="axios" className="bg-dark-900 text-white">Axios</option>
                <option value="go" className="bg-dark-900 text-white">Go</option>
              </select>
            </div>

            {onImportCollectionToWorkspace && (
              <button
                onClick={() => onImportCollectionToWorkspace(collection)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold rounded-lg shadow-lg shadow-brand-500/25 transition-all"
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
        <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border-b border-dark-800 px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-brand-accent" />
              <h2 className="text-xl font-bold text-white tracking-tight">{collection.name}</h2>
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
              <option value="curl" className="bg-dark-900 text-white">cURL</option>
              <option value="fetch" className="bg-dark-900 text-white">JavaScript (fetch)</option>
              <option value="python" className="bg-dark-900 text-white">Python</option>
              <option value="axios" className="bg-dark-900 text-white">Node Axios</option>
              <option value="go" className="bg-dark-900 text-white">Go</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Documentation Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Table of Contents Sidebar */}
        <div className="w-64 bg-dark-900/60 border-r border-dark-800 p-4 space-y-4 overflow-y-auto flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
              Endpoints ({filteredRequests.length})
            </div>

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

        {/* Documentation Items Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
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
                  className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6"
                >
                  {/* Endpoint Header */}
                  <div className="flex items-start justify-between border-b border-dark-800 pb-4">
                    <div className="space-y-1 max-w-2xl">
                      {req.folderName && (
                        <div className="text-xs text-amber-400 font-semibold flex items-center space-x-1">
                          <Folder className="w-3.5 h-3.5" />
                          <span>{req.folderName}</span>
                        </div>
                      )}
                      <h3 className="text-base font-bold text-white tracking-tight">{req.name}</h3>
                      {req.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{req.description}</p>
                      )}

                      {/* Request URL Box */}
                      <div className="flex items-center space-x-2 pt-2">
                        <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded border ${getMethodColor(req.method)}`}>
                          {req.method}
                        </span>
                        <code className="text-xs font-mono text-slate-200 bg-dark-950 px-3 py-1 rounded-lg border border-dark-800 flex-1">
                          {req.url}
                        </code>
                      </div>
                    </div>

                    {/* Run in Workspace Button */}
                    <button
                      onClick={() => {
                        if (onRunRequestInWorkspace) onRunRequestInWorkspace(req);
                        if (onOpenWorkspaceApp) onOpenWorkspaceApp();
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-dark-850 hover:bg-dark-800 border border-dark-700 hover:border-brand-500 text-xs text-slate-200 hover:text-white rounded-lg transition-all"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Run Endpoint</span>
                    </button>
                  </div>

                  {/* Specs & Code Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Specs */}
                    <div className="space-y-4">
                      {req.params && req.params.filter(p => p.enabled).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Query Parameters</div>
                          <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950 text-xs">
                            <table className="w-full text-left font-mono">
                              <thead className="bg-dark-900 text-slate-400 text-[10px] uppercase">
                                <tr>
                                  <th className="py-2 px-3">Key</th>
                                  <th className="py-2 px-3">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-850">
                                {req.params.filter(p => p.enabled).map((p, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 px-3 text-brand-accent font-semibold">{p.key}</td>
                                    <td className="py-1.5 px-3 text-slate-300">{p.value || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {req.headers && req.headers.filter(h => h.enabled).length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Headers</div>
                          <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950 text-xs">
                            <table className="w-full text-left font-mono">
                              <thead className="bg-dark-900 text-slate-400 text-[10px] uppercase">
                                <tr>
                                  <th className="py-2 px-3">Header</th>
                                  <th className="py-2 px-3">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-850">
                                {req.headers.filter(h => h.enabled).map((h, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 px-3 text-brand-accent font-semibold">{h.key}</td>
                                    <td className="py-1.5 px-3 text-slate-300">{h.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {req.body && req.body.mode === 'raw' && req.body.rawContent && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                            Request Body ({req.body.rawType || 'json'})
                          </div>
                          <pre className="p-3 bg-dark-950 rounded-lg border border-dark-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                            {req.body.rawContent}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Right Panel: Executable Code Snippet */}
                    <div className="space-y-2">
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

                      <div className="bg-dark-950 border border-dark-800 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                        <pre>{snippet}</pre>
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
