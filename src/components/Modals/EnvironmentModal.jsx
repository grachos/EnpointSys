import React, { useState } from 'react';
import { X, Plus, Trash2, Globe, CheckSquare, Square, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export default function EnvironmentModal({ isOpen, onClose, environments, onSaveEnvironments }) {
  const [envList, setEnvList] = useState(environments || []);
  const [selectedEnvId, setSelectedEnvId] = useState(environments[0]?.id || null);
  const [visibleSecrets, setVisibleSecrets] = useState({});

  if (!isOpen) return null;

  const currentEnv = envList.find(e => e.id === selectedEnvId) || envList[0];

  const toggleSecretVisibility = (index) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddEnv = () => {
    const newEnv = {
      id: 'env-' + Date.now(),
      name: 'New Environment',
      variables: [
        { key: 'baseUrl', value: 'https://api.example.com', enabled: true, isSecret: false }
      ]
    };
    const updated = [...envList, newEnv];
    setEnvList(updated);
    setSelectedEnvId(newEnv.id);
  };

  const handleDeleteEnv = (id) => {
    const updated = envList.filter(e => e.id !== id);
    setEnvList(updated);
    if (selectedEnvId === id) {
      setSelectedEnvId(updated[0]?.id || null);
    }
  };

  const handleUpdateEnvName = (id, name) => {
    setEnvList(envList.map(e => e.id === id ? { ...e, name } : e));
  };

  const handleAddVar = (envId) => {
    setEnvList(envList.map(e => {
      if (e.id === envId) {
        return {
          ...e,
          variables: [...e.variables, { key: '', value: '', enabled: true, isSecret: false }]
        };
      }
      return e;
    }));
  };

  const handleUpdateVar = (envId, index, field, val) => {
    setEnvList(envList.map(e => {
      if (e.id === envId) {
        const vars = [...e.variables];
        vars[index] = { ...vars[index], [field]: val };
        return { ...e, variables: vars };
      }
      return e;
    }));
  };

  const handleDeleteVar = (envId, index) => {
    setEnvList(envList.map(e => {
      if (e.id === envId) {
        return {
          ...e,
          variables: e.variables.filter((_, i) => i !== index)
        };
      }
      return e;
    }));
  };

  const handleSave = () => {
    onSaveEnvironments(envList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-brand-accent" />
            <h3 className="font-bold text-sm text-slate-100">Environment Manager</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Environments List */}
          <div className="w-48 bg-dark-950 border-r border-dark-800 p-3 space-y-2 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Environments</span>
              <button
                onClick={handleAddEnv}
                className="p-1 hover:bg-dark-850 text-brand-accent rounded"
                title="Add Environment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {envList.map(env => (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                    selectedEnvId === env.id
                      ? 'bg-brand-500/20 text-brand-accent font-semibold border border-brand-500/30'
                      : 'text-slate-300 hover:bg-dark-850'
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                  {envList.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteEnv(env.id); }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variables Table Content */}
          {currentEnv && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Environment Name:</label>
                <input
                  type="text"
                  value={currentEnv.name}
                  onChange={(e) => handleUpdateEnvName(currentEnv.id, e.target.value)}
                  className="bg-dark-950 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-brand-500 w-full max-w-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Variables</span>
                  <button
                    onClick={() => handleAddVar(currentEnv.id)}
                    className="flex items-center space-x-1 text-xs text-brand-accent hover:underline font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-dark-900 text-slate-400 uppercase text-[10px] border-b border-dark-800">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">Active</th>
                        <th className="py-2 px-3">Variable Key</th>
                        <th className="py-2 px-3">Value</th>
                        <th className="py-2 px-2 w-16 text-center">Type</th>
                        <th className="py-2 px-2 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-850">
                      {currentEnv.variables.map((v, i) => {
                        const isSecret = Boolean(v.isSecret);
                        const isVisible = visibleSecrets[i];

                        return (
                          <tr key={i} className="hover:bg-dark-900/50">
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleUpdateVar(currentEnv.id, i, 'enabled', !v.enabled)}
                                className="text-slate-400 hover:text-brand-accent"
                              >
                                {v.enabled ? <CheckSquare className="w-4 h-4 text-brand-accent" /> : <Square className="w-4 h-4 text-slate-600" />}
                              </button>
                            </td>
                            <td className="py-1 px-2">
                              <div className="flex items-center space-x-1">
                                {isSecret && <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" title="Secret Variable" />}
                                <input
                                  type="text"
                                  placeholder="key"
                                  value={v.key}
                                  onChange={(e) => handleUpdateVar(currentEnv.id, i, 'key', e.target.value)}
                                  className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                                />
                              </div>
                            </td>
                            <td className="py-1 px-2 relative">
                              <div className="flex items-center space-x-1">
                                <input
                                  type={isSecret && !isVisible ? "password" : "text"}
                                  placeholder="value"
                                  value={v.value}
                                  onChange={(e) => handleUpdateVar(currentEnv.id, i, 'value', e.target.value)}
                                  className="w-full bg-dark-900 border border-dark-800 rounded px-2 py-1 pr-7 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                                />
                                {isSecret && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSecretVisibility(i)}
                                    className="absolute right-3 text-slate-400 hover:text-white p-0.5 rounded"
                                    title={isVisible ? "Hide Value" : "Show Value"}
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleUpdateVar(currentEnv.id, i, 'isSecret', !isSecret)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center justify-center space-x-1 transition-all ${
                                  isSecret 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                    : 'bg-dark-800 text-slate-400 border border-dark-700 hover:text-slate-200'
                                }`}
                                title={isSecret ? "Secret Variable (Masked)" : "Default Variable (Plain Text)"}
                              >
                                {isSecret ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                                <span className="uppercase text-[9px]">{isSecret ? 'Secret' : 'Text'}</span>
                              </button>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => handleDeleteVar(currentEnv.id, i)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete Variable"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-dark-800 flex justify-end space-x-2 bg-dark-950">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-dark-850 hover:bg-dark-800 text-xs text-slate-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-lg shadow-brand-500/20">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
