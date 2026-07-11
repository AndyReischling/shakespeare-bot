/**
 * ingest-play.ts — build data/hamlet.json with the FULL text of Hamlet (§3.1).
 *
 * Source: Project Gutenberg #1524 (public domain), the fallback named in the spec
 * when the Folger API is not wired. Parses acts/scenes/speakers/stage-directions,
 * derives per-scene `onstage` (which powers the encounter knowledge boundary), and
 * emits one entry per verse line: {ftln, ref, act, scene, speaker, text, onstage[],
 * notes_ref[], sd?}.
 *
 * Because full-text line numbering differs from the curated subset, the script also
 * RECONCILES the hand-authored line refs in the refusal map, trial skin, variorum,
 * and chips so every citation still resolves and jumps the book.
 *
 * Run: `npm run ingest:play`. Set FOLGER_HAMLET_URL / GUTENBERG_URL to override.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const GUTENBERG_URL = process.env.GUTENBERG_URL || "https://www.gutenberg.org/files/1524/1524-0.txt";
const LOCAL_CACHE = "/tmp/hamlet-raw.txt";
const ROOT = process.cwd();

// ── roman numerals ──────────────────────────────────────────────────────────
function roman(s: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = map[s[i]];
    const nv = map[s[i + 1]] ?? 0;
    n += v < nv ? -v : v;
  }
  return n;
}

// ── speaker normalization ───────────────────────────────────────────────────
const SPEAKER_MAP: Record<string, string> = {
  KING: "Claudius",
  QUEEN: "Gertrude",
  GHOST: "Ghost",
  HAMLET: "Hamlet",
  POLONIUS: "Polonius",
  LAERTES: "Laertes",
  OPHELIA: "Ophelia",
  HORATIO: "Horatio",
  ROSENCRANTZ: "Rosencrantz",
  GUILDENSTERN: "Guildenstern",
  OSRIC: "Osric",
  MARCELLUS: "Marcellus",
  BARNARDO: "Barnardo",
  BERNARDO: "Barnardo",
  FRANCISCO: "Francisco",
  REYNALDO: "Reynaldo",
  VOLTEMAND: "Voltemand",
  CORNELIUS: "Cornelius",
  FORTINBRAS: "Fortinbras",
  PRIEST: "Priest",
  SAILOR: "Sailor",
  MESSENGER: "Messenger",
  GENTLEMAN: "Gentleman",
  CAPTAIN: "Captain",
  LORD: "Lord",
  SERVANT: "Servant",
  PROLOGUE: "Prologue",
  "PLAYER KING": "Player King",
  "PLAYER QUEEN": "Player Queen",
  "FIRST PLAYER": "First Player",
  "FIRST CLOWN": "First Clown",
  "SECOND CLOWN": "Second Clown",
  "FIRST SAILOR": "Sailor",
  "FIRST AMBASSADOR": "First Ambassador",
  ALL: "All",
  BOTH: "Both",
  DANES: "Danes",
};

function titleCase(core: string): string {
  return core
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeSpeaker(core: string): string {
  return SPEAKER_MAP[core] ?? titleCase(core);
}

// character tokens to detect in stage directions (for onstage presence)
const DIR_TOKENS: Record<string, string> = {
  hamlet: "Hamlet",
  king: "Claudius",
  claudius: "Claudius",
  queen: "Gertrude",
  gertrude: "Gertrude",
  ghost: "Ghost",
  polonius: "Polonius",
  laertes: "Laertes",
  ophelia: "Ophelia",
  horatio: "Horatio",
  rosencrantz: "Rosencrantz",
  guildenstern: "Guildenstern",
  osric: "Osric",
  marcellus: "Marcellus",
  barnardo: "Barnardo",
  bernardo: "Barnardo",
  francisco: "Francisco",
  reynaldo: "Reynaldo",
  voltemand: "Voltemand",
  cornelius: "Cornelius",
  fortinbras: "Fortinbras",
};

// ── line classification ─────────────────────────────────────────────────────
const DIR_START = /^(Enter|Re-enter|Exeunt|Exit|Manet|Flourish|Alarum|Hautboys|Trumpets|Drum|March)\b/;

function isStageDirection(s: string): boolean {
  return s.startsWith("[") || DIR_START.test(s);
}

function isSpeaker(s: string): boolean {
  if (!s.endsWith(".")) return false;
  const core = s.slice(0, -1).trim();
  if (!core || core.length > 32) return false;
  if (/[a-z]/.test(core)) return false; // dialogue has lowercase
  if (!/[A-Z]/.test(core)) return false; // must have a letter (not "II.")
  return true;
}

function cleanSD(s: string): string {
  return s
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/_/g, "")
    .trim();
}

interface Entry {
  ftln: number;
  ref: string;
  act: number;
  scene: number;
  speaker: string;
  text: string;
  onstage: string[];
  notes_ref: string[];
  sd?: boolean;
}

async function loadRaw(): Promise<string> {
  if (existsSync(LOCAL_CACHE)) {
    const cached = await readFile(LOCAL_CACHE, "utf8");
    if (cached.length > 10000) return cached;
  }
  const res = await fetch(GUTENBERG_URL);
  if (!res.ok) throw new Error(`Gutenberg fetch failed: ${res.status}`);
  return res.text();
}

async function main() {
  const raw = await loadRaw();
  const lines = raw.split(/\r?\n/);

  const start = lines.findIndex((l) => /^ACT\s+[IVXL]+\s*$/.test(l.trim()));
  if (start < 0) throw new Error("Could not find ACT I in source.");

  const entries: Entry[] = [];
  const sceneTitles = new Map<string, string>();
  const scenePresent = new Map<string, Set<string>>();

  let act = 0;
  let scene = 0;
  let sceneLineNo = 0;
  let curSpeaker = "";
  let ftln = 1;

  const present = (sid: string) => {
    if (!scenePresent.has(sid)) scenePresent.set(sid, new Set());
    return scenePresent.get(sid)!;
  };

  for (let i = start; i < lines.length; i++) {
    const rawLine = lines[i];
    const s = rawLine.trim();
    if (/^\*\*\*\s*END OF/i.test(s)) break;
    if (!s) continue;

    const actM = s.match(/^ACT\s+([IVXL]+)\s*$/);
    if (actM) {
      act = roman(actM[1]);
      continue;
    }
    const scM = s.match(/^SCENE\s+([IVXL]+)\.\s*(.*)$/);
    if (scM) {
      scene = roman(scM[1]);
      sceneLineNo = 0;
      curSpeaker = "";
      const sid = `${act}.${scene}`;
      if (scM[2]) sceneTitles.set(sid, scM[2].replace(/\.$/, "").trim());
      present(sid);
      continue;
    }
    if (act === 0 || scene === 0) continue;
    const sid = `${act}.${scene}`;

    const scanDir = (text: string) => {
      const low = ` ${text.toLowerCase()} `;
      for (const [tok, name] of Object.entries(DIR_TOKENS)) {
        if (low.includes(` ${tok} `) || low.includes(` ${tok},`) || low.includes(` ${tok}.`) || low.includes(`,${tok} `)) {
          present(sid).add(name);
        }
      }
    };

    // Pure stage direction (Enter/Exeunt/… not starting with a bracket).
    if (DIR_START.test(s) && !s.startsWith("[")) {
      entries.push({ ftln: ftln++, ref: "", act, scene, speaker: "", text: cleanSD(s), onstage: [], notes_ref: [], sd: true });
      scanDir(s);
      continue;
    }

    let body = s;
    // A leading bracketed direction may precede dialogue on the same line
    // (e.g. "[_Aside._] A little more than kin…"). Emit the direction, keep the rest.
    const leadM = body.match(/^(?:\[_?[^\]]*_?\]\s*)+/);
    if (leadM) {
      const dir = cleanSD(leadM[0].trim());
      if (dir) {
        entries.push({ ftln: ftln++, ref: "", act, scene, speaker: "", text: dir, onstage: [], notes_ref: [], sd: true });
        scanDir(leadM[0]);
      }
      body = body.slice(leadM[0].length);
    }
    // strip any remaining inline directions from the dialogue text
    body = body.replace(/\[_?[^\]]*_?\]/g, "").replace(/\s+/g, " ").trim();
    if (!body) continue;

    if (isSpeaker(body)) {
      curSpeaker = normalizeSpeaker(body.slice(0, -1).trim());
      present(sid).add(curSpeaker);
      continue;
    }

    // dialogue line
    sceneLineNo += 1;
    entries.push({
      ftln: ftln++,
      ref: `${act}.${scene}.${sceneLineNo}`,
      act,
      scene,
      speaker: curSpeaker,
      text: body,
      onstage: [],
      notes_ref: [],
    });
    if (curSpeaker) present(sid).add(curSpeaker);
  }

  // assign per-scene onstage to every entry
  for (const e of entries) {
    const set = scenePresent.get(`${e.act}.${e.scene}`);
    e.onstage = set ? Array.from(set).sort() : [];
  }

  // scenes[]
  const sceneIds = Array.from(new Set(entries.map((e) => `${e.act}.${e.scene}`)));
  const scenes = sceneIds.map((id) => {
    const [a, sc] = id.split(".").map(Number);
    return { id, act: a, scene: sc, title: sceneTitles.get(id) || `Act ${a}, Scene ${sc}`, summary: "" };
  });

  const doc = {
    work: "The Tragedy of Hamlet, Prince of Denmark",
    author: "William Shakespeare",
    source: {
      note: "Full text ingested from Project Gutenberg #1524 (public domain). One entry per verse line; refs are act.scene.line (per-scene line count). onstage is the per-scene presence set derived from stage directions + speakers, powering the encounter knowledge boundary.",
      canonical: "Folger Shakespeare Library",
      fallback: "Project Gutenberg #1524",
    },
    scenes,
    lines: entries,
  };

  await writeFile(resolve(ROOT, "data/hamlet.json"), JSON.stringify(doc, null, 2));

  // Slim client-facing book: drops onstage/notes_ref (server-only) so the book
  // pane doesn't ship the whole knowledge-boundary graph to the browser.
  const book = {
    work: doc.work,
    scenes,
    lines: entries.map((e) => ({
      ftln: e.ftln,
      ref: e.ref,
      act: e.act,
      scene: e.scene,
      speaker: e.speaker,
      text: e.text,
      ...(e.sd ? { sd: true } : {}),
    })),
  };
  await writeFile(resolve(ROOT, "data/hamlet.book.json"), JSON.stringify(book));

  const dialogue = entries.filter((e) => !e.sd).length;
  console.log(`[ingest-play] Wrote ${entries.length} entries (${dialogue} lines, ${entries.length - dialogue} stage directions) across ${scenes.length} scenes.`);

  await reconcile(entries);
}

// ── ref reconciliation ──────────────────────────────────────────────────────
// Map each hand-authored ref to an identifying phrase within its scene, resolve
// the new ref from the full text, and rewrite the dependent files.
const ANCHORS: { old: string; scene: string; phrase: string }[] = [
  { old: "1.2.67", scene: "1.2", phrase: "more than kin" },
  { old: "1.2.129", scene: "1.2", phrase: "too too" },
  { old: "1.2.143", scene: "1.2", phrase: "Frailty, thy name" },
  { old: "1.5.9", scene: "1.5", phrase: "father’s spirit" },
  { old: "1.5.31", scene: "1.5", phrase: "unnatural murder" },
  { old: "1.5.92", scene: "1.5", phrase: "Remember me" },
  { old: "1.5.116", scene: "1.5", phrase: "out of joint" },
  { old: "3.1.57", scene: "3.1", phrase: "To be, or not to be" },
  { old: "3.1.90", scene: "3.1", phrase: "conscience does make cowards" },
  { old: "3.1.101", scene: "3.1", phrase: "remembrances of yours" },
  { old: "3.1.121", scene: "3.1", phrase: "to a nunnery" },
  { old: "3.1.131", scene: "3.1", phrase: "Where’s your father" },
  { old: "3.1.132", scene: "3.1", phrase: "At home, my lord" },
  { old: "3.4.25", scene: "3.4", phrase: "a rat" },
  { old: "3.4.32", scene: "3.4", phrase: "I know not" },
  { old: "3.4.35", scene: "3.4", phrase: "almost as bad" },
  { old: "3.4.39", scene: "3.4", phrase: "for thy better" },
  { old: "3.4.105", scene: "3.4", phrase: "cleft my heart" },
  { old: "4.4.34", scene: "4.4", phrase: "How all occasions" },
  { old: "4.4.65", scene: "4.4", phrase: "thoughts be bloody" },
];

function norm(s: string): string {
  return s.replace(/[’]/g, "'").toLowerCase();
}

async function reconcile(entries: Entry[]) {
  const mapping: Record<string, string> = {};
  const misses: string[] = [];
  for (const a of ANCHORS) {
    const hit = entries.find(
      (e) => !e.sd && `${e.act}.${e.scene}` === a.scene && norm(e.text).includes(norm(a.phrase)),
    );
    if (hit) mapping[a.old] = hit.ref;
    else misses.push(`${a.old} ("${a.phrase}" in ${a.scene})`);
  }
  if (misses.length) console.warn("[ingest-play] anchor misses:", misses.join("; "));
  console.log("[ingest-play] ref remap:", JSON.stringify(mapping));

  const files = [
    "data/refusal-map.json",
    "lib/engine/skins/trial.hamlet.json",
    "data/variorum/1.2.json",
    "data/variorum/3.1.json",
    "data/variorum/3.4.json",
    "lib/chips.ts",
  ];

  for (const rel of files) {
    const p = resolve(ROOT, rel);
    if (!existsSync(p)) continue;
    let text = await readFile(p, "utf8");
    // two-pass with placeholders to avoid collisions between old/new refs
    const keys = Object.keys(mapping).sort((x, y) => y.length - x.length);
    keys.forEach((oldRef, idx) => {
      text = text.split(oldRef).join(`@@REF${idx}@@`);
    });
    keys.forEach((oldRef, idx) => {
      text = text.split(`@@REF${idx}@@`).join(mapping[oldRef]);
    });
    await writeFile(p, text);
  }
  console.log(`[ingest-play] reconciled refs in ${files.length} files.`);
}

main().catch((e) => {
  console.error("[ingest-play] FAILED:", e);
  process.exitCode = 1;
});
