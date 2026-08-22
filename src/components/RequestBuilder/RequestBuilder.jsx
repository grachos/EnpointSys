import React, { useState } from 'react';
import { Send, Save, Loader2, Edit2 } from 'lucide-react';
import ParamsEditor from './ParamsEditor';
import AuthEditor from './AuthEditor';
import HeadersEditor from './HeadersEditor';
import BodyEditor from './BodyEditor';
import ScriptEditor from './ScriptEditor';
import SettingsEditor from './SettingsEditor';
import { translations } from '../../i18n/translations';

export default function RequestBuilder({
  request,
  isDirty = false,
  onChange,
  onSend,
  onSave,
  isLoading,
  activeEnvironment,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState('params');
  const [isEditingName, setIsEditingName] = useState(false);

  if (!request) return null;

  const method = (request.method || 'GET').toUpperCase();
  const url = request.url || '';

  const getMethodBadgeColor = (m) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'PUT': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'OPTIONS': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    }
  };

  const activeParamsCount = (request.params || []).filter(p => p.enabled && p.key).length;
  const activeHeadersCount = (request.headers || []).filter(h => h.enabled && h.key).length;

  return (
    <div className="flex flex-col h-full bg-dark-900 border-b border-dark-800">
      {/* Request Header Title Bar */}
      <div className="px-3 md:px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <input
              type="text"
              value={request.name}
              onChange={(e) => onChange({ ...request, name: e.target.value })}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              autoFocus
              className="bg-dark-950 border border-brand-500 rounded px-2 py-0.5 text-xs text-white font-semibold focus:outline-none"
            />
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="flex items-center space-x-1.5 cursor-pointer hover:bg-dark-850 px-2 py-0.5 rounded transition-colors group"
            >
              <h2 className="text-xs font-bold text-slate-200 flex items-center">
                <span>{request.name}</span>
                {isDirty && (
                  <span className="text-amber-400 font-bold ml-1 text-sm leading-none" title="Unsaved changes">
                    *
                  </span>
                )}
              </h2>
              <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Action Save Button */}
        <button
          onClick={onSave}
          className={`flex items-center space-x-1.5 px-3 py-1 border text-xs rounded font-medium transition-all ${
            isDirty
              ? 'bg-brand-500/20 hover:bg-brand-500/30 border-brand-500/50 text-brand-300 hover:text-white shadow-sm ring-1 ring-brand-500/30'
              : 'bg-dark-850 hover:bg-dark-800 border-dark-700 text-slate-300 hover:text-white'
          }`}
          title={isDirty ? 'Save changes (Ctrl+S)' : 'Saved'}
        >
          <Save className={`w-3.5 h-3.5 ${isDirty ? 'text-brand-400' : 'text-brand-accent'}`} />
          <span>{t.save}</span>
        </button>
      </div>

      {/* Main Request Control Bar: Method + URL + Send */}
      <div className="px-3 md:px-4 py-2 flex items-center space-x-2">
        {/* Method Select */}
        <div className="relative">
          <select
            value={method}
            onChange={(e) => onChange({ ...request, method: e.target.value })}
            className={`appearance-none text-xs font-bold font-mono border rounded-l-lg px-2.5 md:px-3 py-2.5 focus:outline-none cursor-pointer pr-5 md:pr-6 ${getMethodBadgeColor(method)}`}
          >
            <option value="GET" className="bg-dark-900 text-emerald-400">GET</option>
            <option value="POST" className="bg-dark-900 text-amber-400">POST</option>
            <option value="PUT" className="bg-dark-900 text-blue-400">PUT</option>
            <option value="DELETE" className="bg-dark-900 text-rose-400">DELETE</option>
            <option value="PATCH" className="bg-dark-900 text-purple-400">PATCH</option>
            <option value="OPTIONS" className="bg-dark-900 text-cyan-400">OPTIONS</option>
            <option value="HEAD" className="bg-dark-900 text-pink-400">HEAD</option>
          </select>
        </div>

        {/* URL Input */}
        <div className="flex-1 relative min-w-0">
          <input
            type="text"
            placeholder={t.urlPlaceholder}
            value={url}
            onChange={(e) => onChange({ ...request, url: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            className="w-full bg-dark-950 border border-dark-800 rounded-r-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner truncate"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={isLoading}
          className="flex items-center space-x-1.5 md:space-x-2 px-3 md:px-5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">{t.sending}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t.send}</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-tabs Bar: Params, Auth, Headers, Body, Scripts, Settings */}
      <div className="flex items-center space-x-1 px-2 md:px-4 pt-2 border-b border-dark-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('params')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'params'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.params}</span>
          {activeParamsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-accent text-[10px] flex items-center justify-center font-mono ml-1">
              {activeParamsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'auth'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.auth}</span>
          {request.auth?.type !== 'none' && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'headers'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.headers}</span>
          {activeHeadersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-accent text-[10px] flex items-center justify-center font-mono ml-1">
              {activeHeadersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('body')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'body'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.body}</span>
          {request.body?.mode !== 'none' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'scripts'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.scripts}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-1.5 px-2.5 md:px-3 font-semibold border-b-2 transition-all flex items-center space-x-1 ${
            activeTab === 'settings'
              ? 'border-brand-500 text-brand-accent'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.settings}</span>
        </button>
      </div>

      {/* Sub-tab Content Area */}
      <div className="flex-1 overflow-y-auto bg-dark-900">
        {activeTab === 'params' && (
          <ParamsEditor
            params={request.params || []}
            onChange={(params) => onChange({ ...request, params })}
          />
        )}
        {activeTab === 'auth' && (
          <AuthEditor
            auth={request.auth || {}}
            onChange={(auth) => onChange({ ...request, auth })}
          />
        )}
        {activeTab === 'headers' && (
          <HeadersEditor
            headers={request.headers || []}
            onChange={(headers) => onChange({ ...request, headers })}
          />
        )}
        {activeTab === 'body' && (
          <BodyEditor
            body={request.body || {}}
            onChange={(body) => onChange({ ...request, body })}
          />
        )}
        {activeTab === 'scripts' && (
          <ScriptEditor
            scripts={request.scripts || {}}
            onChange={(scripts) => onChange({ ...request, scripts })}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsEditor
            settings={request.settings || {}}
            onChange={(settings) => onChange({ ...request, settings })}
          />
        )}
      </div>
    </div>
  );
}
