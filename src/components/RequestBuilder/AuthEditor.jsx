import React from 'react';
import { ShieldCheck, Key, Lock, User } from 'lucide-react';

export default function AuthEditor({ auth = {}, onChange }) {
  const type = auth.type || 'none';

  const handleUpdate = (field, value) => {
    onChange({
      ...auth,
      [field]: value
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <label className="text-xs font-semibold text-slate-400">Authentication Type:</label>
        <select
          value={type}
          onChange={(e) => handleUpdate('type', e.target.value)}
          className="bg-dark-900 border border-dark-700 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-brand-500 font-medium cursor-pointer"
        >
          <option value="none">Inherit / No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apiKey">API Key</option>
        </select>
      </div>

      <div className="bg-dark-950 border border-dark-800 rounded-lg p-4 max-w-xl">
        {type === 'none' && (
          <div className="text-xs text-slate-400 flex items-center space-x-2 py-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>This request does not use authentication headers or keys.</span>
          </div>
        )}

        {type === 'bearer' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-accent">
              <Key className="w-4 h-4" />
              <span>Bearer Token Authentication</span>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Token Value:</label>
              <input
                type="text"
                placeholder="e.g. eyJhbGciOiJIUzI1Ni... or {{authToken}}"
                value={auth.bearerToken || ''}
                onChange={(e) => handleUpdate('bearerToken', e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Appends <code className="text-brand-accent">Authorization: Bearer &lt;token&gt;</code> header to the request.</p>
            </div>
          </div>
        )}

        {type === 'basic' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-accent">
              <Lock className="w-4 h-4" />
              <span>Basic Authentication</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Username:</label>
                <input
                  type="text"
                  placeholder="Username or {{user}}"
                  value={auth.basicUser || ''}
                  onChange={(e) => handleUpdate('basicUser', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Password:</label>
                <input
                  type="password"
                  placeholder="Password or {{pass}}"
                  value={auth.basicPass || ''}
                  onChange={(e) => handleUpdate('basicPass', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Encodes credentials as Base64 in <code className="text-brand-accent">Authorization: Basic ...</code> header.</p>
          </div>
        )}

        {type === 'apiKey' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-accent">
              <Key className="w-4 h-4" />
              <span>API Key Authentication</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Key Name:</label>
                <input
                  type="text"
                  placeholder="X-API-Key"
                  value={auth.apiKeyKey || ''}
                  onChange={(e) => handleUpdate('apiKeyKey', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Value:</label>
                <input
                  type="text"
                  placeholder="Secret key or {{apiKey}}"
                  value={auth.apiKeyValue || ''}
                  onChange={(e) => handleUpdate('apiKeyValue', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Add to:</label>
              <select
                value={auth.apiKeyAddParams || 'header'}
                onChange={(e) => handleUpdate('apiKeyAddParams', e.target.value)}
                className="bg-dark-900 border border-dark-800 text-xs text-slate-200 rounded px-3 py-1 focus:outline-none focus:border-brand-500"
              >
                <option value="header">Request Header</option>
                <option value="query">URL Query Params</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
