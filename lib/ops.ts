// ops.ts — lightweight, infra-free operational guards (spec §1): per-IP rate
// limit, global daily API-call cap, optional access gate. In-memory counters are
// fine for a single-instance, password-gated demo; swap for a shared store if it
// ever scales.

const ipHits = new Map<string, { count: number; windowStart: number }>();
let dailyCalls = 0;
let dailyWindowStart = Date.now();

const MINUTE = 60_000;
const DAY = 24 * 60 * 60_000;

function num(env: string | undefined, dflt: number): number {
  const n = Number(env);
  return Number.isFinite(n) && n > 0 ? n : dflt;
}

export interface GuardResult {
  ok: boolean;
  status?: number;
  reason?: string;
}

export function checkAccess(headerToken: string | null): GuardResult {
  const required = process.env.ACCESS_PASSWORD;
  if (!required) return { ok: true }; // open in local dev
  if (headerToken && headerToken === required) return { ok: true };
  return { ok: false, status: 401, reason: "This prototype is behind a password. Ask your evaluator link." };
}

export function checkRate(ip: string): GuardResult {
  const now = Date.now();
  const limit = num(process.env.IP_RATE_LIMIT_PER_MIN, 20);
  const rec = ipHits.get(ip);
  if (!rec || now - rec.windowStart > MINUTE) {
    ipHits.set(ip, { count: 1, windowStart: now });
  } else {
    rec.count += 1;
    if (rec.count > limit) {
      return { ok: false, status: 429, reason: "You're going a little fast — give it a moment." };
    }
  }
  return { ok: true };
}

// Only the real-model path consumes the daily API cap; the offline understudy
// makes no external calls and is never capped.
export function checkDailyCap(): GuardResult {
  const now = Date.now();
  if (now - dailyWindowStart > DAY) {
    dailyWindowStart = now;
    dailyCalls = 0;
  }
  const cap = num(process.env.GLOBAL_DAILY_CALL_CAP, 1500);
  if (dailyCalls >= cap) {
    return {
      ok: false,
      status: 429,
      reason: "The prototype has reached today's global usage cap. Try again tomorrow.",
    };
  }
  return { ok: true };
}

export function noteApiCall(): void {
  dailyCalls += 1;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}
