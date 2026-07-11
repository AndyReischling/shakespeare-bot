// retrieval.ts — dual-index RAG over the play + criticism (spec §3.1/§3.2).
// Default path is a deterministic lexical scorer (TF-IDF cosine) so the demo
// runs with zero API keys and never dead-ends. When an embeddings provider is
// configured, callers can build a vector index and swap in cosine over vectors.

import { hamlet, tier1, pointerIndex } from "./corpus";
import type { Line, RetrievedPassage, Tier1Chunk, PointerEntry } from "./types";

// ── lexical index (TF-IDF) ──────────────────────────────────────────────────

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "by",
  "for", "with", "as", "is", "it", "that", "this", "my", "thy", "his", "her",
  "our", "your", "their", "i", "he", "she", "we", "they", "you", "not", "so",
  "do", "does", "did", "be", "am", "are", "was", "were", "what", "which", "who",
  // navigation/request words from user queries, never content
  "me", "us", "take", "go", "show", "look", "turn", "tell", "let", "lets",
  "about", "want", "like", "see", "read", "work", "through", "scene", "line",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

interface Doc {
  id: string;
  tokens: string[];
  tf: Map<string, number>;
}

function buildDocs(items: { id: string; text: string }[]): {
  docs: Doc[];
  idf: Map<string, number>;
} {
  const docs: Doc[] = items.map((it) => {
    const tokens = tokenize(it.text);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return { id: it.id, tokens, tf };
  });
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const t of new Set(d.tokens)) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map<string, number>();
  const N = docs.length || 1;
  for (const [t, n] of df) idf.set(t, Math.log(1 + N / n));
  return { docs, idf };
}

function score(query: string, doc: Doc, idf: Map<string, number>): number {
  const q = tokenize(query);
  if (q.length === 0) return 0;
  let s = 0;
  const seen = new Set<string>();
  for (const t of q) {
    if (seen.has(t)) continue;
    seen.add(t);
    const tf = doc.tf.get(t) || 0;
    if (tf === 0) continue;
    const w = idf.get(t) || 0.5;
    s += (1 + Math.log(tf)) * w;
  }
  // length-normalize a touch so short famous lines aren't unfairly buried
  return s / Math.sqrt(doc.tokens.length + 1);
}

// Dialogue only — stage directions are not citable evidence.
const dialogue = hamlet.lines.filter((l) => !l.sd && l.ref);

// Per-speech (line) index and a per-scene index (dual-index, §3.1).
const lineItems = dialogue.map((l) => ({ id: l.ref, text: `${l.speaker}: ${l.text}` }));
const lineIndex = buildDocs(lineItems);

const sceneAgg = new Map<string, string>();
for (const l of dialogue) {
  const sid = `${l.act}.${l.scene}`;
  sceneAgg.set(sid, (sceneAgg.get(sid) || "") + " " + l.text);
}
const sceneItems = Array.from(sceneAgg.entries()).map(([id, text]) => ({ id, text }));
const sceneIndex = buildDocs(sceneItems);

const critItems = tier1.map((c) => ({ id: c.id, text: `${c.critic} ${c.work} ${c.text}` }));
const critIndex = buildDocs(critItems);

const lineByRef = new Map<string, Line>(dialogue.map((l) => [l.ref, l]));
const critById = new Map<string, Tier1Chunk>(tier1.map((c) => [c.id, c]));

export interface RetrieveOptions {
  topK?: number;
  // Encounter knowledge boundary (§4.3): restrict to lines the character
  // witnessed. Pass the character's witnessed scene ids and/or a name.
  witnessedScenes?: Set<string>;
  onlyCharacterKnows?: string;
}

export function retrievePassages(query: string, opts: RetrieveOptions = {}): RetrievedPassage[] {
  const topK = opts.topK ?? 5;
  const scored = lineIndex.docs
    .map((d) => ({ ref: d.id, s: score(query, d, lineIndex.idf) }))
    .filter((x) => x.s > 0);

  let results = scored;
  if (opts.witnessedScenes || opts.onlyCharacterKnows) {
    results = results.filter((x) => {
      const line = lineByRef.get(x.ref)!;
      const sid = `${line.act}.${line.scene}`;
      if (opts.witnessedScenes && !opts.witnessedScenes.has(sid)) return false;
      if (opts.onlyCharacterKnows && !line.onstage.includes(opts.onlyCharacterKnows))
        return false;
      return true;
    });
  }

  results.sort((a, b) => b.s - a.s);
  return results.slice(0, topK).map((x) => {
    const l = lineByRef.get(x.ref)!;
    return {
      ftln: l.ftln,
      ref: l.ref,
      speaker: l.speaker,
      text: l.text,
      score: Number(x.s.toFixed(3)),
      scene: `${l.act}.${l.scene}`,
    };
  });
}

export function retrieveScenes(query: string, topK = 2): { scene: string; score: number }[] {
  return sceneIndex.docs
    .map((d) => ({ scene: d.id, score: Number(score(query, d, sceneIndex.idf).toFixed(3)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function retrieveCriticism(query: string, topK = 3): Tier1Chunk[] {
  return critIndex.docs
    .map((d) => ({ id: d.id, s: score(query, d, critIndex.idf) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map((x) => critById.get(x.id)!)
    .filter(Boolean);
}

// Tier 2 pointers — matched by topic keyword overlap; the avatar points, never quotes.
export function retrievePointers(topicOrQuery: string, topK = 2): PointerEntry[] {
  const q = tokenize(topicOrQuery);
  return pointerIndex
    .map((p) => {
      const hay = tokenize(`${p.topics.join(" ")} ${p.position} ${p.author} ${p.work}`);
      const s = q.filter((t) => hay.includes(t)).length;
      return { p, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map((x) => x.p);
}

// Unused-evidence retrieval (§5.1 closing): passages relevant to the theory that
// the user never cited. `citedRefs` is the set of refs already brought in.
export function retrieveUnused(
  query: string,
  citedRefs: Set<string>,
  topK = 4,
): RetrievedPassage[] {
  return retrievePassages(query, { topK: topK + citedRefs.size })
    .filter((p) => !citedRefs.has(p.ref))
    .slice(0, topK);
}
