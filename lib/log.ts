// log.ts — anonymous session logging sink (spec §1). The in-product notice tells
// users sessions are logged anonymously to improve the prototype. This is a
// swappable sink; for the demo it writes structured lines to stdout (captured by
// the host's log drain) and never records IPs or identifiers.

interface LogRecord {
  ts: string;
  mode: string;
  skin?: string;
  phase?: string;
  character?: string;
  refusalId?: string | null;
  refusalMethod?: string;
  licenseOk?: boolean;
  usedModel: boolean;
  inputLen: number;
  outputLen: number;
}

export function logTurn(rec: Omit<LogRecord, "ts">): void {
  if ((process.env.LOG_SESSIONS || "on").toLowerCase() !== "on") return;
  const line: LogRecord = { ts: new Date().toISOString(), ...rec };
  // eslint-disable-next-line no-console
  console.log("[session]", JSON.stringify(line));
}
