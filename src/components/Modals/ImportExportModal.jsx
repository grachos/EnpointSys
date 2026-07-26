import React, { useState } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, Globe, Link, Loader2, Info, Database } from 'lucide-react';
import { parseImportFile, exportToPostmanFormat, importFromPublishedUrl } from '../../services/importExportService';
import { exportDatabaseDump, importDatabaseDump } from '../../services/dbService';

export default function ImportExportModal({
  isOpen,
  mode = 'import', // import or export
  onClose,
  collections,
  onImportCollection
}) {
  const [importTab, setImportTab] = useState('file'); // file, url, db
  const [jsonText, setJsonText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  if (!isOpen) return null;

  const isPostmanWorkspaceUrl = urlInput.includes('postman.co/workspace') || urlInput.includes('postman.com/workspace');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        setJsonText(content);
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg('Failed to read file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (importTab === 'url') {
      if (!urlInput.trim()) {
        setErrorMsg('Please enter a valid Published Documentation or Collection URL.');
        return;
      }

      setIsLoadingUrl(true);
      try {
        const collection = await importFromPublishedUrl(urlInput);
        onImportCollection(collection);
        setSuccessMsg(`Successfully imported catalog "${collection.name}"!`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoadingUrl(false);
      }
      return;
    }

    if (importTab === 'db') {
      if (!jsonText.trim()) {
        setErrorMsg('Please select or paste an EndpointSys Database Dump JSON file.');
        return;
      }

      try {
        const dumpData = JSON.parse(jsonText);
        await importDatabaseDump(dumpData);
        setSuccessMsg('Successfully restored entire IndexedDB Database! Refreshing page...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        setErrorMsg('Database Restore failed: ' + err.message);
      }
      return;
    }

    // Process Raw JSON / File
    if (!jsonText.trim()) {
      setErrorMsg('Please paste JSON content or select a file to import.');
      return;
    }

    try {
      const collection = parseImportFile(jsonText);
      onImportCollection(collection);
      setSuccessMsg(`Successfully imported catalog "${collection.name}"!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleExportFullDatabase = async () => {
    try {
      const dumpData = await exportDatabaseDump();
      const filename = `EndpointSys_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dumpData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg('Database Dump exported successfully!');
    } catch (err) {
      setErrorMsg('Database Export failed: ' + err.message);
    }
  };

  const handleDownloadExport = (exportType) => {
    const col = collections.find(c => c.id === selectedCollectionId) || collections[0];
    if (!col) return;

    let exportData;
    let filename = `${col.name.toLowerCase().replace(/\s+/g, '_')}_export.json`;

    if (exportType === 'postman') {
      exportData = exportToPostmanFormat(col);
      filename = `${col.name.toLowerCase().replace(/\s+/g, '_')}_postman_collection.json`;
    } else {
      exportData = { type: 'endpointsys-collection', collection: col };
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {mode === 'import' ? <Upload className="w-5 h-5 text-emerald-400" /> : <Download className="w-5 h-5 text-amber-400" />}
            <h3 className="font-bold text-sm text-slate-100">
              {mode === 'import' ? 'Import Catalog / Database Backup' : 'Export Collection / DB Backup'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {mode === 'import' ? (
            <>
              {/* Import Mode Tabs */}
              <div className="flex items-center space-x-2 border-b border-dark-800 pb-2 text-xs">
                <button
                  onClick={() => setImportTab('file')}
                  className={`font-semibold py-1 px-3 rounded transition-colors ${
                    importTab === 'file' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON File / Raw Text
                </button>
                <button
                  onClick={() => setImportTab('url')}
                  className={`font-semibold py-1 px-3 rounded transition-colors flex items-center space-x-1 ${
                    importTab === 'url' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Published Docs Link</span>
                </button>
                <button
                  onClick={() => setImportTab('db')}
                  className={`font-semibold py-1 px-3 rounded transition-colors flex items-center space-x-1 ${
                    importTab === 'db' ? 'bg-dark-800 text-brand-accent' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Restore DB Dump</span>
                </button>
              </div>

              {importTab === 'file' && (
                <>
                  <p className="text-xs text-slate-400">
                    Upload a <strong>Postman v2.1 Collection JSON</strong>, <strong>OpenAPI 3.0 Spec</strong>, or paste raw catalog JSON.
                  </p>

                  <div className="border-2 border-dashed border-dark-700 hover:border-brand-500 rounded-lg p-5 text-center cursor-pointer bg-dark-950 transition-colors">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="import-file-input"
                    />
                    <label htmlFor="import-file-input" className="cursor-pointer block">
                      <FileText className="w-7 h-7 text-brand-accent mx-auto mb-1.5 opacity-80" />
                      <span className="text-xs font-semibold text-slate-200">Click to select catalog JSON file</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Or Paste Raw Catalog JSON:</label>
                    <textarea
                      rows={5}
                      placeholder={`{ "info": { "name": "My Collection" }, "item": [...] }`}
                      value={jsonText}
                      onChange={(e) => { setJsonText(e.target.value); setErrorMsg(null); }}
                      className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </>
              )}

              {importTab === 'url' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Paste a <strong>Published Postman Documentation Link</strong> (e.g. <code>https://documenter.getpostman.com/view/...</code>) or an EndpointSys public doc link to import all endpoints directly into your workspace catalog.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Published Documentation URL / Postman Link:</label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Link className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. https://documenter.getpostman.com/view/219..."
                          value={urlInput}
                          onChange={(e) => { setUrlInput(e.target.value); setErrorMsg(null); }}
                          className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>

                  {isPostmanWorkspaceUrl && (
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <div className="font-semibold text-amber-400">Postman Workspace Link Tip</div>
                        <div className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                          If this Postman workspace is private or protected by Postman login, export the collection in your Postman app (Collection &rarr; Export &rarr; Postman v2.1 JSON) and drop the file in the <strong>JSON File</strong> tab above!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importTab === 'db' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Restore full database backup into IndexedDB (EndpointSysDB). Select an <code>EndpointSys_Database_Backup.json</code> file.
                  </p>

                  <div className="border-2 border-dashed border-dark-700 hover:border-brand-500 rounded-lg p-5 text-center cursor-pointer bg-dark-950 transition-colors">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="db-dump-input"
                    />
                    <label htmlFor="db-dump-input" className="cursor-pointer block">
                      <Database className="w-7 h-7 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                      <span className="text-xs font-semibold text-slate-200">Select Database Backup JSON file</span>
                    </label>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <div className="flex items-center space-x-2 font-semibold text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Import Status</span>
                  </div>
                  <div className="pl-6 text-[11px] leading-relaxed font-mono">{errorMsg}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                Select a collection to export, or perform a full Database Backup dump of EndpointSysDB.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Collection to Export:</label>
                <select
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 text-xs text-slate-100 rounded p-2.5 focus:outline-none focus:border-brand-500"
                >
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleDownloadExport('postman')}
                  className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500 rounded-lg text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-brand-accent">Postman v2.1 Format</div>
                  <div className="text-[10px] text-slate-500 mt-1">Export as standard Postman collection JSON.</div>
                </button>

                <button
                  onClick={() => handleDownloadExport('native')}
                  className="p-3 bg-dark-950 hover:bg-dark-850 border border-dark-800 hover:border-brand-500 rounded-lg text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-brand-accent">EndpointSys Native</div>
                  <div className="text-[10px] text-slate-500 mt-1">Export full native format.</div>
                </button>
              </div>

              <div className="pt-3 border-t border-dark-800">
                <button
                  onClick={handleExportFullDatabase}
                  className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Full Database Backup Dump (IndexedDB)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Export all collections, environments, queries, secrets, and execution history into a single backup JSON.</div>
                  </div>
                  <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-dark-800 flex justify-end space-x-2 bg-dark-950">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-dark-850 hover:bg-dark-800 text-xs text-slate-300">
            Cancel
          </button>

          {mode === 'import' && (
            <button
              onClick={handleProcessImport}
              disabled={isLoadingUrl}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isLoadingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{isLoadingUrl ? 'Fetching Docs...' : (importTab === 'db' ? 'Restore DB' : 'Import Catalog')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
