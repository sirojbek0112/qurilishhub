import { handleStaticFallbackRequest } from './staticFallback.ts';

const TOKEN_KEY = 'qh_access_token';
const REFRESH_KEY = 'qh_refresh_token';
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

let backendAvailable: boolean | null = null;

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isBackendAvailable(): boolean | null {
  return backendAvailable;
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearAuthTokens();
      return null;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setAuthTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (backendAvailable === false) {
    return (await handleStaticFallbackRequest(url, options, headers.get('Authorization'))) as T;
  }

  try {
    let res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      backendAvailable = false;
      return (await handleStaticFallbackRequest(url, options, headers.get('Authorization'))) as T;
    }

    backendAvailable = true;

    if (res.status === 401 && localStorage.getItem(REFRESH_KEY)) {
      const newAccess = await tryRefresh();
      if (newAccess) {
        headers.set('Authorization', `Bearer ${newAccess}`);
        res = await fetch(`${API_BASE}${url}`, { ...options, headers });
      }
    }

    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};

    if (!res.ok) {
      throw new Error(payload?.error || `Request failed (${res.status})`);
    }
    return payload as T;
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('Unexpected token'))) {
      backendAvailable = false;
      return (await handleStaticFallbackRequest(url, options, headers.get('Authorization'))) as T;
    }
    throw err;
  }
}
