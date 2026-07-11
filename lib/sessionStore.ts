// sessionStore.ts — one module behind which the persistence layer is swappable
// (spec §1: memory + localStorage now; a real store later without touching callers).

import type { ChatTurn, Mode } from "./types";

export interface SessionState {
  id: string;
  mode: Mode | null;
  createdAt: number;
  tokensUsed: number;
  history: Record<string, ChatTurn[]>; // keyed by room (mode/character/skin)
}

interface Backend {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

const memory: Record<string, string> = {};

const memoryBackend: Backend = {
  read: (k) => (k in memory ? memory[k] : null),
  write: (k, v) => {
    memory[k] = v;
  },
  remove: (k) => {
    delete memory[k];
  },
};

function localBackend(): Backend {
  return {
    read: (k) => {
      try {
        return window.localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    write: (k, v) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* quota / private mode — fall through to memory copy */
        memory[k] = v;
      }
    },
    remove: (k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {
        delete memory[k];
      }
    },
  };
}

function backend(): Backend {
  if (typeof window !== "undefined" && "localStorage" in window) return localBackend();
  return memoryBackend;
}

const KEY = "rehearsal-room:session:v1";

function newSession(): SessionState {
  return {
    id: `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`,
    mode: null,
    createdAt: Date.now(),
    tokensUsed: 0,
    history: {},
  };
}

export function loadSession(): SessionState {
  const raw = backend().read(KEY);
  if (!raw) {
    const s = newSession();
    backend().write(KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    const s = newSession();
    backend().write(KEY, JSON.stringify(s));
    return s;
  }
}

export function saveSession(s: SessionState): void {
  backend().write(KEY, JSON.stringify(s));
}

export function resetSession(): SessionState {
  const s = newSession();
  backend().write(KEY, JSON.stringify(s));
  return s;
}

export function getHistory(s: SessionState, room: string): ChatTurn[] {
  return s.history[room] ?? [];
}

export function appendTurn(s: SessionState, room: string, turn: ChatTurn): SessionState {
  const next: SessionState = {
    ...s,
    history: { ...s.history, [room]: [...(s.history[room] ?? []), turn] },
  };
  saveSession(next);
  return next;
}
