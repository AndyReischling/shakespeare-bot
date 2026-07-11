// textLicense.ts — citation verification (spec §6).
// Post-generation check on every Encounter/Case turn: extract quoted strings +
// ftln/ref citations, fuzzy-match against hamlet.json. Any quote < 0.92
// similarity is a "miss": the caller strips it and regenerates once with a
// correction instruction, falling back to citation-by-reference. In Case mode
// this same layer surfaces diegetically as the objection/ruling mechanics.

import { hamlet, getLineByRef } from "./corpus";

const THRESHOLD = 0.92;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Dice coefficient over character bigrams — stable fuzzy string similarity.
function dice(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0;
  const bigrams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) || 0) + 1);
    }
    return m;
  };
  const ma = bigrams(na);
  const mb = bigrams(nb);
  let inter = 0;
  for (const [g, c] of ma) {
    if (mb.has(g)) inter += Math.min(c, mb.get(g)!);
  }
  return (2 * inter) / (na.length - 1 + (nb.length - 1));
}

export interface QuoteCheck {
  quote: string;
  bestRef: string | null;
  similarity: number;
  ok: boolean;
}

export interface CitationCheck {
  ref: string;
  exists: boolean;
}

export interface LicenseReport {
  ok: boolean;
  quotes: QuoteCheck[];
  citations: CitationCheck[];
  misses: QuoteCheck[];
  badCitations: string[];
}

// Extract "quoted strings" — straight and curly double quotes.
export function extractQuotes(text: string): string[] {
  const out: string[] = [];
  const re = /["“]([^"”]{3,240})["”]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1].trim());
  return out;
}

// Extract citations: act.scene.line refs and [FTLN nnnn] tokens.
export function extractCitations(text: string): string[] {
  const refs = new Set<string>();
  const reRef = /\b(\d)\.(\d)\.(\d{1,3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = reRef.exec(text))) refs.add(`${m[1]}.${m[2]}.${m[3]}`);
  const reFtln = /FTLN\s*(\d{1,4})/gi;
  while ((m = reFtln.exec(text))) {
    const line = hamlet.lines.find((l) => l.ftln === Number(m![1]));
    if (line) refs.add(line.ref);
  }
  return Array.from(refs);
}

const dialogueLines = hamlet.lines.filter((l) => !l.sd && l.ref);

let _allText: string[] | null = null;
function corpusStrings(): string[] {
  if (!_allText) _allText = dialogueLines.map((l) => l.text);
  return _allText;
}

export function checkQuote(quote: string): QuoteCheck {
  let best = 0;
  let bestRef: string | null = null;
  const q = normalize(quote);
  for (const line of dialogueLines) {
    // compare the quote against the line and against sliding windows so a short
    // quote can match part of a multi-clause line.
    const full = dice(q, line.text);
    let windowed = full;
    if (line.text.length > q.length + 8) {
      const words = line.text.split(/\s+/);
      const qWords = q.split(/\s+/).length;
      for (let i = 0; i + qWords <= words.length; i++) {
        const win = words.slice(i, i + qWords + 1).join(" ");
        windowed = Math.max(windowed, dice(q, win));
      }
    }
    const sim = Math.max(full, windowed);
    if (sim > best) {
      best = sim;
      bestRef = line.ref;
    }
  }
  return {
    quote,
    bestRef,
    similarity: Number(best.toFixed(3)),
    ok: best >= THRESHOLD,
  };
}

export function verifyOutput(text: string): LicenseReport {
  const quotes = extractQuotes(text).map(checkQuote);
  const citations = extractCitations(text).map((ref) => ({
    ref,
    exists: Boolean(getLineByRef(ref)),
  }));
  const misses = quotes.filter((q) => !q.ok);
  const badCitations = citations.filter((c) => !c.exists).map((c) => c.ref);
  return {
    ok: misses.length === 0 && badCitations.length === 0,
    quotes,
    citations,
    misses,
    badCitations,
  };
}

// A correction instruction fed back to the model on the single regeneration pass.
export function correctionInstruction(report: LicenseReport): string {
  const parts: string[] = [];
  if (report.misses.length) {
    parts.push(
      `These quoted strings do not match the text of Hamlet and must be removed or corrected to the exact wording: ${report.misses
        .map((m) => `"${m.quote}"`)
        .join(", ")}. If you cannot quote a line verbatim, cite it by reference (e.g. 3.4.32) without quotation marks.`,
    );
  }
  if (report.badCitations.length) {
    parts.push(
      `These citations point to lines not in the corpus and must be removed or replaced with a real reference: ${report.badCitations.join(", ")}.`,
    );
  }
  return parts.join(" ");
}
