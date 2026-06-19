const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Returns the JWT stored in localStorage, or null.
 */
export function getStoredToken() {
  return localStorage.getItem('dpdp_token');
}

/**
 * Core fetch wrapper — attaches JWT Bearer token to every request.
 */
async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiGet   = (path)       => apiFetch(path);
export const apiPost  = (path, body) => apiFetch(path, { method: 'POST',  body: JSON.stringify(body) });
export const apiPatch = (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
