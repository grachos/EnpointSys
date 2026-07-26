import React from 'react';
import { Sparkles, Plus, Trash2, Code } from 'lucide-react';

export default function BodyEditor({ body = {}, onChange }) {
  const mode = body.mode || 'none';
  const rawType = body.rawType || 'json';
  const rawContent = body.rawContent || '';

  const handleUpdate = (field, value) => {
    onChange({
      ...body,
      [field]: value
    });
  };

  const handlePrettifyJson = () => {
    if (!rawContent) return;
    try {
      const parsed = JSON.parse(rawContent);
      handleUpdate('rawContent', JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert('Unable to format: Invalid JSON content');
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Radio Modes */}
      <div className="flex items-center space-x-4 border-b border-dark-800 pb-2 text-xs">
        {['none', 'raw', 'x-www-form-urlencoded', 'form-data', 'graphql'].map((m) => (
          <label key={m} className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white font-medium">
            <input
              type="radio"
              name="bodyMode"
              checked={mode === m}
              onChange={() => handleUpdate('mode', m)}
              className="text-brand-500 focus:ring-brand-500 bg-dark-900 border-dark-700"
            />
            <span className="capitalize">{m.replace(/-/g, ' ')}</span>
          </label>
        ))}
      </div>

      {mode === 'none' && (
        <div className="py-8 text-center text-slate-500 text-xs">
          This request does not have a body payload.
        </div>
      )}

      {mode === 'raw' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400">Content Type:</label>
              <select
                value={rawType}
                onChange={(e) => handleUpdate('rawType', e.target.value)}
                className="bg-dark-900 border border-dark-800 text-xs text-brand-accent font-mono rounded px-2 py-1 focus:outline-none"
              >
                <option value="json">JSON (application/json)</option>
                <option value="xml">XML (application/xml)</option>
                <option value="html">HTML (text/html)</option>
                <option value="text">Text (text/plain)</option>
              </select>
            </div>

            {rawType === 'json' && (
              <button
                onClick={handlePrettifyJson}
                className="flex items-center space-x-1 text-xs text-brand-accent hover:text-brand-400 bg-dark-850 px-2.5 py-1 rounded border border-dark-700 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prettify JSON</span>
              </button>
            )}
          </div>

          <textarea
            rows={10}
            placeholder={`Enter ${rawType.toUpperCase()} body content... (e.g. { "key": "value" })`}
            value={rawContent}
            onChange={(e) => handleUpdate('rawContent', e.target.value)}
            className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>
      )}

      {mode === 'x-www-form-urlencoded' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Form URL Encoded key-value pairs:</p>
          <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900 text-slate-400 font-mono text-[10px] uppercase border-b border-dark-800">
                <tr>
                  <th className="py-2 px-3">Key</th>
                  <th className="py-2 px-3">Value</th>
                  <th className="py-2 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-850">
                {(body.urlencoded || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={item.key || ''}
                        onChange={(e) => {
                          const list = [...(body.urlencoded || [])];
                          list[idx].key = e.target.value;
                          handleUpdate('urlencoded', list);
                        }}
                        className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={item.value || ''}
                        onChange={(e) => {
                          const list = [...(body.urlencoded || [])];
                          list[idx].value = e.target.value;
                          handleUpdate('urlencoded', list);
                        }}
                        className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => {
                          const list = (body.urlencoded || []).filter((_, i) => i !== idx);
                          handleUpdate('urlencoded', list);
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              const list = [...(body.urlencoded || []), { key: '', value: '', enabled: true }];
              handleUpdate('urlencoded', list);
            }}
            className="text-xs text-brand-accent hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Form Parameter</span>
          </button>
        </div>
      )}

      {mode === 'graphql' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">GraphQL Query:</label>
            <textarea
              rows={8}
              placeholder="query { ... }"
              value={body.graphql?.query || ''}
              onChange={(e) => handleUpdate('graphql', { ...body.graphql, query: e.target.value })}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">GraphQL Variables (JSON):</label>
            <textarea
              rows={8}
              placeholder="{ }"
              value={body.graphql?.variables || ''}
              onChange={(e) => handleUpdate('graphql', { ...body.graphql, variables: e.target.value })}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
