import React, { useState } from 'react';
import { X, Lock, User, Shield, AlertCircle, Key, Loader2 } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { login } from '../../services/dbService';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, lang = 'es' }) {
  const t = translations[lang] || translations.es;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const { ok, data } = await login(username, password);
    setIsLoading(false);

    if (ok && data && data.success) {
      onLoginSuccess(data.token, data.user);
      onClose();
    } else {
      setErrorMsg((data && data.error) || (lang === 'es' ? 'Error al iniciar sesión. Compruebe credenciales.' : 'Login failed. Please check credentials.'));
    }
  };

  const handleQuickLogin = (userType) => {
    setUsername(userType === 'admin' ? 'admin' : 'operador');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-brand-accent" />
            <h3 className="font-bold text-sm text-slate-100">{t.staffAccess}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          <p className="text-xs text-slate-400">{t.loginSubtitle}</p>

          {/* Quick Login Presets */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 bg-dark-950 hover:bg-dark-850 border border-amber-500/30 hover:border-amber-500 rounded text-left transition-all"
            >
              <div className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>{t.quickAdmin}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Role: admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('operador')}
              className="p-2 bg-dark-950 hover:bg-dark-850 border border-blue-500/30 hover:border-blue-500 rounded text-left transition-all"
            >
              <div className="text-xs font-bold text-blue-400 flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>{t.quickOperador}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Role: operador</div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.username}:</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder={t.username}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t.password}:</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2 border-t border-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-dark-850 hover:bg-dark-800 text-xs text-slate-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>{isLoading ? t.authenticating : t.staffLogin}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
