"use client";

// GA-style счётчики GitScience (Часть 2): посещения + онлайн.
// Хранятся ТОЛЬКО в БД бэкенда — не сбрасываются при рестарте/деплое.
// IP не передаётся; анонимный session_id живёт в sessionStorage до закрытия вкладки.
import { getApiBase } from "./constants";

const SESSION_KEY = "gitscience_session_id";
const PING_INTERVAL_MS = 60_000;

export interface PingCounts {
  total_site_visits?: number;
  active_visitors_online?: number;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined" || typeof crypto === "undefined") return "";
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      const b = new Uint8Array(16);
      if (typeof crypto.getRandomValues === "function") {
        crypto.getRandomValues(b);
      }
      sid = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

function doPing(): Promise<PingCounts> {
  const sid = getOrCreateSessionId();
  if (!sid || (typeof document !== "undefined" && document.hidden)) {
    return Promise.resolve({});
  }
  return fetch(`${getApiBase()}/api/v1/stats/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sid }),
  })
    .then((r) => r.json())
    .catch(() => ({}) as PingCounts);
}

export function startVisitPing(onCounts?: (counts: PingCounts) => void): () => void {
  const run = () => {
    void doPing().then((counts) => onCounts?.(counts));
  };

  run();
  const id = window.setInterval(run, PING_INTERVAL_MS);
  return () => window.clearInterval(id);
}