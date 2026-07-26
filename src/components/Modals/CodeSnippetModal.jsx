import React, { useState } from 'react';
import { X, Code2, Copy, Check } from 'lucide-react';
import { generateCodeSnippet } from '../../services/snippetGenerator';

export default function CodeSnippetModal({ isOpen, onClose, request }) {
  const [language, setLanguage] = useState('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !request) return null;

  const snippet = generateCodeSnippet(request, language);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-brand-accent" />
            <h3 className="font-bold text-sm text-white">Generate Code Snippet</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-400">Language / Library:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-dark-950 border border-dark-800 text-xs text-brand-accent font-semibold rounded px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="curl">cURL Command</option>
                <option value="fetch">JavaScript (fetch)</option>
                <option value="python">Python (requests)</option>
                <option value="axios">Node.js (axios)</option>
                <option value="go">Go (net/http)</option>
              </select>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-dark-850 hover:bg-dark-800 border border-dark-700 rounded text-xs text-slate-200 hover:text-white font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-accent" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="relative bg-dark-950 rounded-lg border border-dark-800 p-4">
            <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {snippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-dark-800 flex justify-end bg-dark-950">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-dark-850 hover:bg-dark-800 text-xs text-slate-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
