// Server-side corpus loader. Reads the file-based data layer once and caches it.
// No database, no infra (spec §1).

import hamletData from "@/data/hamlet.json";
import refusalData from "@/data/refusal-map.json";
import tier1Data from "@/data/criticism/tier1.json";
import pointerData from "@/data/modern-criticism-index.json";
import type {
  Hamlet,
  Line,
  RefusalEntry,
  Tier1Chunk,
  PointerEntry,
  SceneMeta,
} from "./types";

export const hamlet = hamletData as unknown as Hamlet;
export const refusalMap = (refusalData as any).entries as RefusalEntry[];
export const tier1 = (tier1Data as any).chunks as Tier1Chunk[];
export const pointerIndex = (pointerData as any).entries as PointerEntry[];

const byRef = new Map<string, Line>();
const byFtln = new Map<number, Line>();
for (const line of hamlet.lines) {
  if (line.sd || !line.ref) continue; // stage directions are not citable
  byRef.set(line.ref, line);
  byFtln.set(line.ftln, line);
}

export function getLineByRef(ref: string): Line | undefined {
  return byRef.get(ref);
}

export function getLineByFtln(ftln: number): Line | undefined {
  return byFtln.get(ftln);
}

export function getScene(id: string): { meta?: SceneMeta; lines: Line[] } {
  const meta = hamlet.scenes.find((s) => s.id === id);
  const lines = hamlet.lines.filter((l) => `${l.act}.${l.scene}` === id);
  return { meta, lines };
}

export function allScenes(): SceneMeta[] {
  return hamlet.scenes;
}

// Who is present/aware in a given scene — powers the encounter knowledge boundary.
export function onstageForScene(sceneId: string): Set<string> {
  const present = new Set<string>();
  for (const l of hamlet.lines) {
    if (`${l.act}.${l.scene}` === sceneId) {
      l.onstage.forEach((c) => present.add(c));
    }
  }
  return present;
}

// Every scene a character is present in (their witnessed world).
export function scenesWitnessedBy(character: string): Set<string> {
  const scenes = new Set<string>();
  for (const l of hamlet.lines) {
    if (l.onstage.includes(character)) scenes.add(`${l.act}.${l.scene}`);
  }
  return scenes;
}

// Parse an ftln range token like "4.4.34-4.4.65" or a single "3.4.32" into refs
// present in the corpus.
export function refsInRange(token: string): Line[] {
  const [start, end] = token.split("-").map((s) => s.trim());
  if (!end) {
    const l = getLineByRef(start);
    return l ? [l] : [];
  }
  const s = getLineByRef(start);
  const e = getLineByRef(end);
  if (!s || !e) {
    // fall back to matching scene + line window numerically
    return [];
  }
  return hamlet.lines.filter((l) => l.ftln >= s.ftln && l.ftln <= e.ftln);
}
