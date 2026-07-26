import React from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export default function ParamsEditor({ params = [], onChange }) {
  const handleAddParam = () => {
    const newParam = { id: 'p-' + Date.now(), key: '', value: '', enabled: true, description: '' };
    onChange([...params, newParam]);
  };

  const handleUpdateParam = (id, field, val) => {
    const updated = params.map(p => p.id === id ? { ...p, [field]: val } : p);
    onChange(updated);
  };

  const handleDeleteParam = (id) => {
    onChange(params.filter(p => p.id !== id));
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Query Parameters</span>
        <button
          onClick={handleAddParam}
          className="flex items-center space-x-1 text-xs text-brand-accent hover:text-brand-400 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Parameter</span>
        </button>
      </div>

      <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900 text-slate-400 uppercase font-mono text-[10px] border-b border-dark-800">
            <tr>
              <th className="py-2 px-3 w-10 text-center">Active</th>
              <th className="py-2 px-3">Key</th>
              <th className="py-2 px-3">Value</th>
              <th className="py-2 px-3">Description</th>
              <th className="py-2 px-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-850">
            {params.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500 text-xs">
                  No query parameters added yet. Click "Add Parameter" above.
                </td>
              </tr>
            ) : (
              params.map((param) => (
                <tr key={param.id} className="hover:bg-dark-900/50">
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleUpdateParam(param.id, 'enabled', !param.enabled)}
                      className="text-slate-400 hover:text-brand-accent transition-colors"
                    >
                      {param.enabled ? (
                        <CheckSquare className="w-4 h-4 text-brand-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. limit)"
                      value={param.key}
                      onChange={(e) => handleUpdateParam(param.id, 'key', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="Value (e.g. 10 or {{limit}})"
                      value={param.value}
                      onChange={(e) => handleUpdateParam(param.id, 'value', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={param.description || ''}
                      onChange={(e) => handleUpdateParam(param.id, 'description', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleDeleteParam(param.id)}
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
