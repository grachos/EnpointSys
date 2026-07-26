import React, { useState } from 'react';
import { Clock, HardDrive, CheckCircle2, XCircle, FileText, Layers, Copy, Check } from 'lucide-react';
import JsonViewer from './JsonViewer';
import { translations } from '../../i18n/translations';

export default function ResponseViewer({ response, testResults, logs, lang = 'en' }) {
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState('pretty');
  const [copied, setCopied] = useState(false);

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-950 p-6 text-center select-none">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 md:w-8 md:h-8 text-slate-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">{t.noResponseYet}</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {t.noResponseDesc}
        </p>
      </div>
    );
  }

  const { status, statusText, time, size, data, rawText, headers, isProxied } = response;

  const getStatusColor = (s) => {
    if (s >= 200 && s < 300) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s >= 300 && s < 400) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (s >= 400 && s < 500) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passedTestsCount = (testResults || []).filter(t => t.passed).length;
  const totalTestsCount = (testResults || []).length;

  return (
    <div className="flex flex-col h-full bg-dark-900 border-t border-dark-800">
      {/* Response Metrics & Status Bar */}
      <div className="px-3 md:px-4 py-2 bg-dark-950 border-b border-dark-800 flex items-center justify-between flex-wrap gap-2">
        {/* Status Badge & Metrics */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded border font-mono ${getStatusColor(status)}`}>
            {status} {statusText}
          </span>

          <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{time} ms</span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatSize(size)}</span>
          </div>

          {isProxied && (
            <span className="hidden sm:inline-block text-[10px] bg-brand-500/10 text-brand-accent border border-brand-500/20 px-1.5 py-0.5 rounded font-mono">
              Proxied CORS
            </span>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setActiveTab('pretty')}
            className={`py-1 px-2.5 rounded font-medium transition-colors ${
              activeTab === 'pretty' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.pretty}
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-1 px-2.5 rounded font-medium transition-colors ${
              activeTab === 'raw' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.raw}
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-1 px-2.5 rounded font-medium transition-colors ${
              activeTab === 'preview' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.preview}
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-1 px-2.5 rounded font-medium transition-colors ${
              activeTab === 'headers' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.headers} ({headers ? headers.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-1 px-2.5 rounded font-medium transition-colors flex items-center space-x-1 ${
              activeTab === 'tests' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.testResults}</span>
            {totalTestsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${passedTestsCount === totalTestsCount ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {passedTestsCount}/{totalTestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Response Data Area */}
      <div className="flex-1 overflow-y-auto p-3 bg-dark-900">
        {activeTab === 'pretty' && (
          typeof data === 'object' ? (
            <JsonViewer data={data} />
          ) : (
            <pre className="p-3 bg-dark-950 rounded-lg border border-dark-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
              {rawText}
            </pre>
          )
        )}

        {activeTab === 'raw' && (
          <div className="relative">
            <button
              onClick={handleCopyRaw}
              className="absolute top-2 right-2 p-1.5 rounded bg-dark-850 border border-dark-700 text-slate-400 hover:text-white transition-all z-10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <textarea
              readOnly
              rows={12}
              value={rawText}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none select-text"
            />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg overflow-hidden h-full min-h-[300px]">
            <iframe
              srcDoc={rawText}
              title="HTML Preview"
              className="w-full h-full min-h-[300px] border-none"
            />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-900 text-slate-400 uppercase text-[10px] border-b border-dark-800">
                <tr>
                  <th className="py-2 px-3">Header</th>
                  <th className="py-2 px-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-850">
                {(headers || []).map((h, i) => (
                  <tr key={i} className="hover:bg-dark-900/50">
                    <td className="py-1.5 px-3 text-brand-accent font-semibold">{h.key}</td>
                    <td className="py-1.5 px-3 text-slate-300 break-all">{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              {t.assertionResults} ({passedTestsCount} / {totalTestsCount})
            </div>

            {totalTestsCount === 0 ? (
              <p className="text-xs text-slate-500">{t.noTests}</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((t, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2.5 ${t.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      {t.error && <div className="font-mono text-[11px] text-rose-400 mt-1">{t.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {logs && logs.length > 0 && (
              <div className="mt-4 pt-3 border-t border-dark-800">
                <div className="text-xs font-semibold text-slate-400 mb-1">{t.consoleLogs}</div>
                <div className="bg-dark-950 p-2.5 rounded-lg border border-dark-800 font-mono text-[11px] text-slate-300 space-y-1">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
