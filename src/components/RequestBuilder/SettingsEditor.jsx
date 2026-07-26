import React from 'react';
import { Sliders, Shield, RefreshCw } from 'lucide-react';

export default function SettingsEditor({ settings = {}, onChange }) {
  const handleUpdate = (field, val) => {
    onChange({
      ...settings,
      [field]: val
    });
  };

  return (
    <div className="p-4 space-y-4 max-w-xl">
      <div className="text-xs font-semibold text-slate-400">Request Settings</div>

      <div className="bg-dark-950 border border-dark-800 rounded-lg p-4 space-y-4 text-xs">
        {/* CORS Proxy */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-200">Enable CORS Proxy Fallback</div>
            <div className="text-[11px] text-slate-500">Automatically bypasses browser CORS restrictions when testing third-party APIs directly from browser.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.useCorsProxy !== false}
            onChange={(e) => handleUpdate('useCorsProxy', e.target.checked)}
            className="w-4 h-4 text-brand-500 rounded bg-dark-900 border-dark-700 focus:ring-brand-500"
          />
        </div>

        {/* Follow Redirects */}
        <div className="flex items-center justify-between border-t border-dark-850 pt-3">
          <div>
            <div className="font-medium text-slate-200">Follow HTTP Redirects</div>
            <div className="text-[11px] text-slate-500">Automatically follow 301 / 302 redirects.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.followRedirects !== false}
            onChange={(e) => handleUpdate('followRedirects', e.target.checked)}
            className="w-4 h-4 text-brand-500 rounded bg-dark-900 border-dark-700 focus:ring-brand-500"
          />
        </div>

        {/* Request Timeout */}
        <div className="border-t border-dark-850 pt-3">
          <label className="block font-medium text-slate-200 mb-1">Request Timeout (ms):</label>
          <input
            type="number"
            placeholder="0 (Unlimited)"
            value={settings.timeout || 0}
            onChange={(e) => handleUpdate('timeout', parseInt(e.target.value) || 0)}
            className="w-full bg-dark-900 border border-dark-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
