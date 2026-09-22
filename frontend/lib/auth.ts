"use client";

import { getApiBase } from "./constants";

let currentToken: string | null = null;
let onTokenRefreshed: ((newToken: string) => void) | null = null;
let onAuthFailure: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Регистрирует глобальный auth-стор для authFetch:
 * - token: текущий Bearer JWT (хранится только в React-состоянии, не в localStorage)
 * - refreshed: вызывается при успешной ротации JWT (обновляет состояние профиля)
 * - failure: вызывается, когда refresh невозможен (токен истёк окончательно)
 */
export function setAuthStore(
  token: string | null,
  handlers: { refreshed?: (newToken: string) => void; failure?: () => void } = {}
) {
  currentToken = token;
  onTokenRefreshed = handlers.refreshed ?? null;
  onAuthFailure = handlers.failure ?? null;
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Ротация JWT на бэкенде: старый jti отзывается, выдаётся новый токен.
 * Параллельные вызовы дедуплицируются (один запрос на поток).
 */
export async function refreshScholarToken(token: string): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string };
      return data.access_token ?? null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * authFetch — обёртка над fetch с авто-авторизацией.
 * При 401 выполняет единственную попытку refresh + повтор оригинального запроса.
 * Если refresh невозможен — вызывает onAuthFailure (разлогинивание сессии).
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = currentToken;
  const baseHeaders = new Headers(init.headers ?? {});
  if (token && !baseHeaders.has("Authorization")) {
    baseHeaders.set("Authorization", `Bearer ${token}`);
  }
  const doFetch = (headers: Headers) => fetch(input, { ...init, headers });

  const res = await doFetch(baseHeaders);
  if (res.status === 401 && currentToken) {
    const newToken = await refreshScholarToken(currentToken);
    if (newToken) {
      currentToken = newToken;
      onTokenRefreshed?.(newToken);
      const retryHeaders = new Headers(baseHeaders);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return doFetch(retryHeaders);
    }
    onAuthFailure?.();
  }
  return res;
}

/** SHA-256 гекс-дайджест строки (WebCrypto). Для привязки evidence_hash к контенту. */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}