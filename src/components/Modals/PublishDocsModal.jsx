import React, { useState } from 'react';
import { X, BookOpen, Share2, Copy, Check, ExternalLink, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { publishCollectionDocs } from '../../services/dbService';

export default function PublishDocsModal({
  isOpen,
  onClose,
  collections,
  onViewDocumentation,
  onTogglePublishCollection,
  lang = 'es'
}) {
  const t = translations[lang] || translations.es;
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || null);
  const [copied, setCopied] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  if (!isOpen) return null;

  const currentCollection = collections.find(c => c.id === selectedCollectionId) || collections[0];
  const isPublished = Boolean(currentCollection?.isPublished);

  const buildUrl = (id, token) => `${window.location.origin}/?doc=${id}&token=${token}`;
  const publicUrl = shareUrl || (currentCollection?.pubToken ? buildUrl(currentCollection.id, currentCollection.pubToken) : '');

  const handlePublishToggle = async () => {
    if (!currentCollection || !onTogglePublishCollection) return;
    const nextPublishedState = !isPublished;

    if (nextPublishedState) {
      // Request a server-signed share token (verified by /api/docs/:id).
      setIsWorking(true);
      const token = await publishCollectionDocs(currentCollection.id);
      setIsWorking(false);
      if (!token) {
        setJustPublished(false);
        return;
      }
      const url = buildUrl(currentCollection.id, token);
      setShareUrl(url);
      onTogglePublishCollection(currentCollection.id, {
        isPublished: true,
        publishedAt: new Date().toLocaleTimeString() + ', ' + new Date().toLocaleDateString(),
        pubToken: token
      });
    } else {
      setShareUrl('');
      onTogglePublishCollection(currentCollection.id, {
        isPublished: false,
        publishedAt: null,
        pubToken: null
      });
    }
    setJustPublished(true);
    setTimeout(() => setJustPublished(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-accent animate-pulse-subtle" />
            <h3 className="font-bold text-sm text-white">{t.publishApiDocs}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">{t.publishDesc}</p>

          {/* Collection Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{t.selectColToPublish}</label>
            <select
              value={selectedCollectionId || ''}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 text-xs text-white rounded p-2.5 focus:outline-none focus:border-brand-500 font-semibold"
            >
              {collections.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isPublished ? ' ✓ (' + t.publishedLive + ')' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Box */}
          <div className="bg-dark-950 border border-dark-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">{t.docsStatus}</span>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${isPublished ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/30 text-slate-400 border-slate-700'}`}>
                {isPublished ? t.publishedLive : t.notPublished}
              </span>
            </div>

            {isPublished && (
              <div className="space-y-2 pt-2 border-t border-dark-850">
                <label className="block text-[11px] font-mono text-slate-400">{t.publicShareLink}</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="w-full bg-dark-900 border border-dark-800 rounded px-2.5 py-1.5 text-xs text-brand-accent font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-1 flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.copied : t.copy}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onViewDocumentation(currentCollection);
                    }}
                    className="text-xs text-brand-accent hover:text-brand-400 font-semibold flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.openNewTab}</span>
                  </button>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {currentCollection.publishedAt ? `Published: ${currentCollection.publishedAt}` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {justPublished && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{isPublished ? '¡Documentación guardada y publicada en MySQL!' : '¡Documentación despublicada!'}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-dark-800">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-dark-850 hover:bg-dark-800 text-xs font-medium text-slate-300"
            >
              {t.cancel}
            </button>

            <button
              onClick={handlePublishToggle}
              disabled={isWorking}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
                isPublished
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
              }`}
            >
              {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isPublished ? t.publishUpdate : t.publishNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
