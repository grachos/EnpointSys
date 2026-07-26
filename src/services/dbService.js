/**
 * Permanent MySQL Database Service for EndpointSys.
 * Talks to the Express backend (default relative "/api" so nginx/Vite proxy it).
 * All calls carry the JWT via the shared apiFetch helper (401 auto-logout).
 */
import { apiFetch, getApiBase } from './api';

export async function checkMySQLHealth() {
  const { ok, data } = await apiFetch('/health');
  return !!(ok && data && data.connected);
}

// --- AUTH ---
export async function login(username, password) {
  const { ok, data } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return { ok, data };
}

export async function fetchCurrentUser() {
  const { ok, data } = await apiFetch('/auth/me');
  return ok && data ? data.user : null;
}

export async function changePassword(currentPassword, newPassword) {
  const { ok, data } = await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return { ok, data };
}

// --- COLLECTIONS ---
export async function getAllCollectionsDB() {
  const { ok, data } = await apiFetch('/collections');
  return ok && Array.isArray(data) ? data : [];
}

export async function saveCollectionsDB(collections) {
  const { ok } = await apiFetch('/collections', {
    method: 'POST',
    body: JSON.stringify(collections)
  });
  return ok;
}

// --- ENVIRONMENTS ---
export async function getAllEnvironmentsDB() {
  const { ok, data } = await apiFetch('/environments');
  return ok && Array.isArray(data) ? data : [];
}

export async function saveEnvironmentsDB(environments) {
  const { ok } = await apiFetch('/environments', {
    method: 'POST',
    body: JSON.stringify(environments)
  });
  return ok;
}

// --- HISTORY ---
export async function getHistoryDB() {
  const { ok, data } = await apiFetch('/history');
  return ok && Array.isArray(data) ? data : [];
}

export async function saveHistoryItemDB(item) {
  const { ok } = await apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify(item)
  });
  return ok;
}

export async function saveHistoryListDB(historyList) {
  if (!historyList || historyList.length === 0) return;
  const items = historyList.slice(0, 200);
  const { ok } = await apiFetch('/history/batch', {
    method: 'POST',
    body: JSON.stringify(items)
  });
  return ok;
}

// --- PREFERENCES ---
export async function getPreferenceDB(key, defaultValue = null) {
  const { ok, data } = await apiFetch(`/preferences/${encodeURIComponent(key)}`);
  return ok && data ? (data.value !== null && data.value !== undefined ? data.value : defaultValue) : defaultValue;
}

export async function setPreferenceDB(key, value) {
  const { ok } = await apiFetch('/preferences', {
    method: 'POST',
    body: JSON.stringify({ key, value })
  });
  return ok;
}

// --- PUBLIC DOCS (signed token) ---
export async function publishCollectionDocs(collectionId) {
  const { ok, data } = await apiFetch('/docs/publish', {
    method: 'POST',
    body: JSON.stringify({ collectionId })
  });
  return ok && data ? data.token : null;
}

export async function getPublicDoc(collectionId, token) {
  const { ok, data } = await apiFetch(`/docs/${encodeURIComponent(collectionId)}?token=${encodeURIComponent(token)}`);
  return ok && data ? data : null;
}

// --- DUMP & RESTORE ---
export async function exportDatabaseDump() {
  const [collections, environments, history] = await Promise.all([
    getAllCollectionsDB(),
    getAllEnvironmentsDB(),
    getHistoryDB()
  ]);
  return {
    app: 'EndpointSys',
    version: '1.0 Pro',
    exportedAt: new Date().toISOString(),
    databaseDump: { collections, environments, history }
  };
}

export async function importDatabaseDump(dump) {
  const dbData = dump.databaseDump || dump.database;
  if (!dbData) throw new Error('Invalid Database Dump format.');
  if (Array.isArray(dbData.collections)) await saveCollectionsDB(dbData.collections);
  if (Array.isArray(dbData.environments)) await saveEnvironmentsDB(dbData.environments);
  if (Array.isArray(dbData.history)) await saveHistoryListDB(dbData.history);
}

export { getApiBase };