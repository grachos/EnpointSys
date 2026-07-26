import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

export default function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (val) => {
    if (typeof val === 'string') return <span className="text-emerald-400">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-amber-400">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-purple-400">{String(val)}</span>;
    if (val === null) return <span className="text-slate-500">null</span>;
    return <span>{String(val)}</span>;
  };

  const Node = ({ name, value, isLast }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);

    if (!isObject) {
      return (
        <div className="font-mono text-xs py-0.5 leading-relaxed">
          {name !== undefined && <span className="text-brand-accent">{name}: </span>}
          {renderValue(value)}
          {!isLast && <span className="text-slate-500">,</span>}
        </div>
      );
    }

    const keys = Object.keys(value);

    return (
      <div className="font-mono text-xs leading-relaxed">
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="inline-flex items-center space-x-1 cursor-pointer hover:bg-dark-850 px-1 rounded transition-colors text-slate-300"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          {name !== undefined && <span className="text-brand-accent">{name}: </span>}
          <span className="text-slate-400">{isArray ? '[' : '{'}</span>
          {isCollapsed && <span className="text-slate-500 text-[10px] ml-1">... {keys.length} items</span>}
          {isCollapsed && <span className="text-slate-400">{isArray ? ']' : '}'}</span>}
        </div>

        {!isCollapsed && (
          <div className="pl-4 border-l border-dark-800 ml-1.5 my-0.5">
            {keys.map((k, i) => (
              <Node key={k} name={isArray ? undefined : k} value={value[k]} isLast={i === keys.length - 1} />
            ))}
          </div>
        )}

        {!isCollapsed && (
          <div>
            <span className="text-slate-400">{isArray ? ']' : '}'}</span>
            {!isLast && <span className="text-slate-500">,</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-dark-850 border border-dark-700 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Copy JSON"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      <div className="p-3 bg-dark-950 rounded-lg border border-dark-800 overflow-x-auto">
        <Node value={data} isLast={true} />
      </div>
    </div>
  );
}
