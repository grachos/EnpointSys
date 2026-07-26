import React, { useState } from 'react';
import { Code2, Play, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function ScriptEditor({ scripts = {}, onChange }) {
  const [activeTab, setActiveTab] = useState('test'); // test, preRequest
  const preRequest = scripts.preRequest || '';
  const test = scripts.test || '';

  const handleUpdate = (field, val) => {
    onChange({
      ...scripts,
      [field]: val
    });
  };

  const insertSnippet = (codeSnippet) => {
    if (activeTab === 'test') {
      const updated = test ? `${test}\n\n${codeSnippet}` : codeSnippet;
      handleUpdate('test', updated);
    } else {
      const updated = preRequest ? `${preRequest}\n\n${codeSnippet}` : codeSnippet;
      handleUpdate('preRequest', updated);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-dark-800 pb-2">
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => setActiveTab('test')}
            className={`font-semibold py-1 px-3 rounded transition-colors ${
              activeTab === 'test'
                ? 'bg-brand-500/20 text-brand-accent border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Post-response Tests / Assertions
          </button>
          <button
            onClick={() => setActiveTab('preRequest')}
            className={`font-semibold py-1 px-3 rounded transition-colors ${
              activeTab === 'preRequest'
                ? 'bg-brand-500/20 text-brand-accent border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pre-request Scripts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* Code Editor */}
        <div className="col-span-3">
          <textarea
            rows={12}
            value={activeTab === 'test' ? test : preRequest}
            onChange={(e) => handleUpdate(activeTab, e.target.value)}
            placeholder={
              activeTab === 'test'
                ? '// Write JavaScript post-response test assertions\n// Example:\npm.test("Status code is 200", function () {\n  pm.response.to.have.status(200);\n});'
                : '// Write JavaScript pre-request script\n// Example:\npm.environment.set("current_time", Date.now());'
            }
            className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>

        {/* Snippets Sidebar */}
        <div className="col-span-1 bg-dark-950 border border-dark-800 rounded-lg p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Quick Snippets
          </div>

          <div className="space-y-1 text-xs">
            <button
              onClick={() => insertSnippet('pm.test("Status code is 200", function () {\n  pm.response.to.have.status(200);\n});')}
              className="w-full text-left p-1.5 rounded hover:bg-dark-850 text-slate-300 hover:text-brand-accent border border-transparent hover:border-dark-800 transition-colors"
            >
              + Status code is 200
            </button>

            <button
              onClick={() => insertSnippet('pm.test("Response time is under 1000ms", function () {\n  pm.expect(pm.response.responseTime).to.be.below(1000);\n});')}
              className="w-full text-left p-1.5 rounded hover:bg-dark-850 text-slate-300 hover:text-brand-accent border border-transparent hover:border-dark-800 transition-colors"
            >
              + Response time &lt; 1000ms
            </button>

            <button
              onClick={() => insertSnippet('pm.test("Check JSON property", function () {\n  var jsonData = pm.response.json();\n  pm.expect(jsonData.id).to.exist;\n});')}
              className="w-full text-left p-1.5 rounded hover:bg-dark-850 text-slate-300 hover:text-brand-accent border border-transparent hover:border-dark-800 transition-colors"
            >
              + Check JSON property
            </button>

            <button
              onClick={() => insertSnippet('pm.environment.set("authToken", "new_token_123");')}
              className="w-full text-left p-1.5 rounded hover:bg-dark-850 text-slate-300 hover:text-brand-accent border border-transparent hover:border-dark-800 transition-colors"
            >
              + Set environment variable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
