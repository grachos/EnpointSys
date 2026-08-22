import React from 'react';
import { X, Plus, Globe } from 'lucide-react';

export default function TabManager({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) {
  return (
    <div className="flex items-center bg-dark-950 border-b border-dark-800 px-2 pt-1.5 overflow-x-auto select-none">
      <div className="flex items-center space-x-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const method = (tab.request.method || 'GET').toUpperCase();
          const name = tab.request.name || 'Untitled Request';
          const isDirty = !!tab.isDirty;

          const getMethodClass = (m) => {
            switch (m) {
              case 'GET': return 'text-emerald-500 font-bold';
              case 'POST': return 'text-amber-500 font-bold';
              case 'PUT': return 'text-blue-500 font-bold';
              case 'DELETE': return 'text-rose-500 font-bold';
              case 'PATCH': return 'text-purple-500 font-bold';
              default: return 'text-cyan-500 font-bold';
            }
          };

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              title={`${name}${isDirty ? ' *' : ''}`}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t border-x transition-all min-w-[130px] max-w-[200px] ${
                isActive
                  ? 'bg-dark-900 border-dark-800 text-slate-100 font-semibold shadow-sm tab-item-active'
                  : 'bg-dark-950/70 border-transparent text-slate-400 hover:bg-dark-900/50 hover:text-slate-200 tab-item-inactive'
              }`}
            >
              <span className={`text-[10px] font-mono uppercase ${getMethodClass(method)}`}>
                {method}
              </span>
              <span className="truncate flex-1 font-medium">{name}</span>
              {isDirty && (
                <span className="text-amber-400 font-bold text-sm leading-none flex-shrink-0" title="Unsaved changes">
                  *
                </span>
              )}

              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-dark-700 text-slate-400 hover:text-rose-400 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onNewTab}
        className="p-1 ml-2 rounded hover:bg-dark-850 text-slate-400 hover:text-slate-100 transition-colors"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
