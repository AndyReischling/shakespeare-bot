// refusal.ts — the refusal-map matcher (spec §3.3).
// Pipeline: embed input -> cosine similarity vs. every authored pattern.
//   score >= 0.75            -> fire (method: "similarity")
//   0.55 <= score < 0.75     -> ONE cheap LLM classification (method: "classifier")
//   otherwise                -> no refusal
// Paraphrase misses are the #1 unattended failure mode, so the classifier
// fallback is not optional — but if no key is present we widen the lexical net
// rather than dead-ending.

import { refusalMap } from "./corpus";
import { localEmbed, cosine } from "./embeddings";
import { classifyYesNo } from "./anthropic";
import type { RefusalEntry, RefusalMatch } from "./types";

const HIT = 0.75;
// The ambiguous band is intentionally wide at the bottom: genuine paraphrases
// with disjoint vocabulary score low on any lexical/hashed signal, so we hand the
// whole band to the mandated LLM classifier (§3.3). The classifier — not the
// lexical score — is what makes paraphrase matching robust in production.
const AMBIGUOUS_LOW = 0.45;
// Key-free fallback: with no classifier available we widen only near the top of
// the band, where lexical evidence is already strong, to avoid false positives.
const NO_CLASSIFIER_WIDEN = 0.55;

interface Precomputed {
  entry: RefusalEntry;
  patternVecs: number[][];
  patternTokenSets: Set<string>[];
}

// Character aliases so "the prince"/"the dane" reads as "hamlet", etc. — a large
// share of paraphrases swap the name for the role.
const ALIAS: Record<string, string> = {
  prince: "hamlet",
  dane: "hamlet",
  queen: "gertrude",
  mother: "gertrude",
  king: "claudius",
  uncle: "claudius",
  spirit: "ghost",
  apparition: "ghost",
  phantom: "ghost",
};

// Very light suffix stemmer so holding/holds/held, delay/delays/delayed,
// madness/mad, murder/murdered collapse together. Not linguistically precise —
// enough to lift paraphrase recall in the key-free offline path.
function stem(w: string): string {
  let s = w;
  if (s.length > 4 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("edly")) s = s.slice(0, -4);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 4 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  if (s.length > 4 && s.endsWith("ness")) s = s.slice(0, -4);
  return s;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => ALIAS[t] ?? t)
    .map(stem);
}

// Normalized string (for the hashed-BoW cosine) built from the same pipeline so
// both similarity signals see the same aliased/stemmed tokens.
function normalized(s: string): string {
  return tokenize(s).join(" ");
}

const precomputed: Precomputed[] = refusalMap.map((entry) => ({
  entry,
  patternVecs: entry.question_patterns.map((p) => localEmbed(normalized(p))),
  patternTokenSets: entry.question_patterns.map((p) => new Set(tokenize(p))),
}));

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

interface Best {
  entry: RefusalEntry;
  score: number;
}

// Blend cosine (hashed BoW) with token-overlap so both exact-ish and reworded
// phrasings surface. Deterministic and key-free.
function bestLexical(input: string): Best | null {
  const iv = localEmbed(normalized(input));
  const it = new Set(tokenize(input));
  let best: Best | null = null;
  for (const pc of precomputed) {
    let top = 0;
    for (let i = 0; i < pc.patternVecs.length; i++) {
      const cos = cosine(iv, pc.patternVecs[i]);
      const jac = jaccard(it, pc.patternTokenSets[i]);
      const blended = 0.6 * cos + 0.4 * jac;
      if (blended > top) top = blended;
    }
    if (!best || top > best.score) best = { entry: pc.entry, score: top };
  }
  return best;
}

export async function matchRefusal(input: string): Promise<RefusalMatch> {
  const best = bestLexical(input);
  if (!best) return { entry: null as any, score: 0, method: "none" };

  const score = Number(best.score.toFixed(3));

  if (score >= HIT) {
    return { entry: best.entry, score, method: "similarity" };
  }

  if (score >= AMBIGUOUS_LOW) {
    // Ambiguous band: one cheap LLM classification against the silence statement.
    const verdict = await classifyYesNo(
      `Is this question substantively asking about ${best.entry.silence_statement}?\n\nQuestion: "${input}"`,
    );
    if (verdict === true) {
      return { entry: best.entry, score, method: "classifier" };
    }
    if (verdict === null) {
      // No classifier available (no key / failure): widen the net near the top of
      // the ambiguous band so paraphrases still land rather than silently miss.
      if (score >= NO_CLASSIFIER_WIDEN) return { entry: best.entry, score, method: "similarity" };
    }
    return { entry: null as any, score, method: "none" };
  }

  return { entry: null as any, score, method: "none" };
}

// Synchronous, key-free variant for places that can't await (e.g. quick UI hints).
export function matchRefusalLexical(input: string): RefusalMatch {
  const best = bestLexical(input);
  if (!best) return { entry: null as any, score: 0, method: "none" };
  const score = Number(best.score.toFixed(3));
  if (score >= HIT) return { entry: best.entry, score, method: "similarity" };
  return { entry: null as any, score, method: "none" };
}
