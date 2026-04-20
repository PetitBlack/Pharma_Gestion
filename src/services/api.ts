/**
 * Client HTTP centralisé — Pharmaa Gest
 * Base URL : http://localhost:3050/api
 *
 * Gestion automatique du token JWT (access + refresh cookie httpOnly).
 * En cas d'expiration du token (401), tente un refresh silencieux.
 * Si le refresh échoue, appelle le handler onUnauthorized enregistré.
 */

const BASE_URL = 'http://localhost:3050/api';

const TOKEN_KEY  = 'pg_access_token';
const USER_KEY   = 'pg_current_user';

// Callback appelé quand la session est définitivement expirée
let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: () => void): void {
  _onUnauthorized = fn;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function storeUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── Refresh silencieux ───────────────────────────────────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    storeToken(data.accessToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

/** Refresh singleton — évite les appels parallèles en cas de 401 simultanés. */
function refreshOnce(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ─── Requête de base ──────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // envoie le cookie refreshToken
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 — essayer le refresh une seule fois
  if (res.status === 401 && !isRetry) {
    const newToken = await refreshOnce();
    if (newToken) {
      return request<T>(method, path, body, true);
    }
    clearAuth();
    _onUnauthorized?.();
    throw new Error('Session expirée — veuillez vous reconnecter');
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const qs = params && Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return request<T>('GET', path + qs);
  },

  post<T>(path: string, body: unknown = {}): Promise<T> {
    return request<T>('POST', path, body);
  },

  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PUT', path, body);
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },

  del<T = void>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
};
