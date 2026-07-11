/**
 * build-refusal-map.ts — validate and lint data/refusal-map.json (§3.3).
 *
 * The refusal map is hand-authored (that is the point — designed silences, with
 * faculty). This script enforces the entry schema so the differentiating artifact
 * can't silently rot: every entry needs 15–25 patterns, a silence statement, a
 * textual surface, >=2 named critical positions, and >=1 Socratic move.
 *
 * Run: `npm run build:refusal`.
 */

import refusalMap from "../data/refusal-map.json";

interface Entry {
  id: string;
  silence_statement: string;
  question_patterns: string[];
  textual_surface: string[];
  critical_positions: { critic: string; position: string }[];
  socratic_moves: string[];
}

function main() {
  const entries = (refusalMap as any).entries as Entry[];
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = new Set<string>();
  for (const e of entries) {
    if (ids.has(e.id)) errors.push(`Duplicate id: ${e.id}`);
    ids.add(e.id);
    if (!e.silence_statement) errors.push(`${e.id}: missing silence_statement`);
    const n = e.question_patterns?.length ?? 0;
    if (n < 15) errors.push(`${e.id}: only ${n} patterns (need 15–25)`);
    if (n > 25) warnings.push(`${e.id}: ${n} patterns (spec suggests ≤25)`);
    if (!e.textual_surface?.length) errors.push(`${e.id}: missing textual_surface`);
    if ((e.critical_positions?.length ?? 0) < 2)
      errors.push(`${e.id}: need >=2 named critical positions (the dissent is the point)`);
    if ((e.socratic_moves?.length ?? 0) < 1) errors.push(`${e.id}: need >=1 socratic_move`);
  }

  console.log(`[build-refusal-map] ${entries.length} entries checked.`);
  warnings.forEach((w) => console.warn("  warn:", w));
  if (errors.length) {
    errors.forEach((er) => console.error("  ERROR:", er));
    process.exitCode = 1;
    console.error(`[build-refusal-map] FAILED with ${errors.length} error(s).`);
  } else {
    console.log("[build-refusal-map] OK — schema valid.");
  }
}

main();
