import React, { useState } from 'react';
import { X, Lock, Key, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { changePassword } from '../../services/dbService';

export default function ChangePasswordModal({ isOpen, onClose, onChanged, username, lang = 'es' }) {
  const t = translations[lang] || translations.es;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isForced = isOpen === true && !onClose;
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 8) {
      setErrorMsg(lang === 'es' ? 'La nueva contraseña debe tener al menos 8 caracteres.' : 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(lang === 'es' ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg(lang === 'es' ? 'La nueva contraseña debe ser diferente a la actual.' : 'New password must differ from the current one.');
      return;
    }

    setIsLoading(true);
    const { ok, data } = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (ok) {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      onChanged && onChanged();
    } else {
      setErrorMsg((data && data.error) || (lang === 'es' ? 'No se pudo cambiar la contraseña.' : 'Could not change password.'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {lang === 'es' ? 'Cambiar contraseña' : 'Change password'}
            </h3>
          </div>
          {!isForced && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            {lang === 'es'
              ? 'Por seguridad, debes establecer una nueva contraseña antes de continuar.'
              : 'For security, you must set a new password before continuing.'}
            {username && <span className="block mt-1 text-[11px] text-slate-500 font-mono">{username}</span>}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'es' ? 'Contraseña actual' : 'Current password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-dark-950 border border-dark-800 rounded pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'es' ? 'Nueva contraseña' : 'New password'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-dark-950 border border-dark-800 rounded pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-dark-950 border border-dark-800 rounded pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
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
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{lang === 'es' ? 'Actualizar contraseña' : 'Update password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}