const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'endpointsys_jwt_token';
const USER_KEY = 'endpointsys_user';

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setAuthSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* ignore */ }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getApiBase() { return API_BASE; }

/**
 * Centralised fetch helper: injects the Authorization header on every call,
 * parses JSON safely, and triggers a global logout on 401.
 * Returns { ok, status, data }.
 */
export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    return { ok: false, status: 0, data: null, networkError: err.message };
  }

  if (res.status === 401) {
    clearAuthSession();
    if (onUnauthorized) onUnauthorized();
  }

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { data = await res.json(); } catch { data = null; }
  }
  return { ok: res.ok, status: res.status, data };
}

export { TOKEN_KEY, USER_KEY };