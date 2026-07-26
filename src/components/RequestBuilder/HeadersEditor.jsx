import React from 'react';
import { Plus, Trash2, CheckSquare, Square, Zap } from 'lucide-react';

export default function HeadersEditor({ headers = [], onChange }) {
  const handleAddHeader = () => {
    const newHeader = { id: 'h-' + Date.now(), key: '', value: '', enabled: true };
    onChange([...headers, newHeader]);
  };

  const handleUpdateHeader = (id, field, val) => {
    const updated = headers.map(h => h.id === id ? { ...h, [field]: val } : h);
    onChange(updated);
  };

  const handleDeleteHeader = (id) => {
    onChange(headers.filter(h => h.id !== id));
  };

  const applyPreset = (key, value) => {
    const existing = headers.find(h => h.key.toLowerCase() === key.toLowerCase());
    if (existing) {
      handleUpdateHeader(existing.id, 'value', value);
      handleUpdateHeader(existing.id, 'enabled', true);
    } else {
      onChange([...headers, { id: 'h-' + Date.now(), key, value, enabled: true }]);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Request Headers</span>
          <span className="text-[10px] text-slate-500 font-mono">({headers.filter(h => h.enabled).length} active)</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Presets */}
          <button
            onClick={() => applyPreset('Content-Type', 'application/json')}
            className="text-[11px] px-2 py-0.5 rounded bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 transition-colors"
          >
            + JSON Content
          </button>
          <button
            onClick={() => applyPreset('Accept', 'application/json')}
            className="text-[11px] px-2 py-0.5 rounded bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 transition-colors"
          >
            + Accept JSON
          </button>

          <button
            onClick={handleAddHeader}
            className="flex items-center space-x-1 text-xs text-brand-accent hover:text-brand-400 font-medium ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Header</span>
          </button>
        </div>
      </div>

      <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
            <tr>
              <th className="py-2 px-3 w-10 text-center">Active</th>
              <th className="py-2 px-3">Header Key</th>
              <th className="py-2 px-3">Value</th>
              <th className="py-2 px-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-850">
            {headers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">
                  No custom headers added yet. Click "Add Header" or use presets above.
                </td>
              </tr>
            ) : (
              headers.map((header) => (
                <tr key={header.id} className="hover:bg-dark-900/50">
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleUpdateHeader(header.id, 'enabled', !header.enabled)}
                      className="text-slate-400 hover:text-brand-accent transition-colors"
                    >
                      {header.enabled ? (
                        <CheckSquare className="w-4 h-4 text-brand-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="Header Name (e.g. Content-Type)"
                      value={header.key}
                      onChange={(e) => handleUpdateHeader(header.id, 'key', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="Value (e.g. application/json or {{authToken}})"
                      value={header.value}
                      onChange={(e) => handleUpdateHeader(header.id, 'value', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleDeleteHeader(header.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
