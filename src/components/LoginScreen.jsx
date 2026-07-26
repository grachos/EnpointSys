import React, { useState } from 'react';
import { Flame, Shield, User, Lock, Key, AlertCircle, Loader2, Languages } from 'lucide-react';
import { translations } from '../i18n/translations';
import { login } from '../services/dbService';

export default function LoginScreen({ onLoginSuccess, initialLang = 'es' }) {
  const [lang, setLang] = useState(initialLang);
  const t = translations[lang] || translations.es;

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const { ok, data } = await login(username, password);
    setIsLoading(false);

    if (ok && data && data.success) {
      onLoginSuccess(data.token, data.user);
    } else {
      setErrorMsg((data && data.error) || (lang === 'es' ? 'Error al iniciar sesión. Usuario o contraseña no válidos.' : 'Login failed. Invalid username or password.'));
    }
  };

  const handleQuickFill = (roleType) => {
    setUsername(roleType === 'admin' ? 'admin' : 'operador');
    setPassword('');
  };

  return (
    <div className="h-screen w-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Float (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-dark-900 border border-dark-800 text-xs font-bold text-brand-accent hover:bg-dark-850 transition-colors shadow-lg"
          title="Cambiar Idioma / Switch Language"
        >
          <Languages className="w-4 h-4" />
          <span>{lang === 'es' ? 'ESPAÑOL (ES)' : 'ENGLISH (EN)'}</span>
        </button>
      </div>

      {/* Main Login Card Container */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden z-10">
        {/* Brand Header */}
        <div className="p-6 text-center border-b border-dark-800 bg-gradient-to-b from-dark-850 to-dark-900">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 mx-auto mb-3 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-brand-accent animate-pulse-subtle" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Endpoint<span className="text-brand-accent">Sys</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t.platformProtection}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-300">
            {lang === 'es' ? 'Seleccione un rol de prueba o ingrese credenciales:' : 'Select Staff Role Preset or Enter Credentials:'}
          </div>

          {/* Quick Role Selection Presets */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className={`p-3 rounded-xl border text-left transition-all ${
                username === 'admin'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-dark-950 border-dark-800 hover:border-dark-700 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold flex items-center space-x-1.5 text-amber-400">
                <Shield className="w-4 h-4" />
                <span>{t.quickAdmin}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('operador')}
              className={`p-3 rounded-xl border text-left transition-all ${
                username === 'operador'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-dark-950 border-dark-800 hover:border-dark-700 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold flex items-center space-x-1.5 text-blue-400">
                <User className="w-4 h-4" />
                <span>{t.quickOperador}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">operador</div>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.username}</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={t.username}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.password}</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-xs font-bold text-white shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            <span>{isLoading ? t.authenticating : t.signInAndUnlock}</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-dark-800 bg-dark-950 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            EndpointSys Platform Protection • XAMPP MySQL Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
