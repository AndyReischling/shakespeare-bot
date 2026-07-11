// meter.ts — scansion utility (spec §4.2: meter-as-evidence).
// A lightweight, dependency-free English syllable + stress heuristic. Not a
// research-grade scanner; enough to make "the meter is evidence" a live move
// in the rehearsal loop (where does the line break iambic pentameter, and why).

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "by",
  "for", "with", "as", "is", "it", "that", "this", "my", "thy", "his", "her",
  "our", "your", "their", "i", "he", "she", "we", "they", "you", "not", "so",
  "too", "do", "does", "did", "be", "am", "are", "was", "were", "no", "nor",
]);

export interface Syllable {
  text: string;
  stressed: boolean;
}

export interface ScannedWord {
  word: string;
  syllables: number;
  stressPattern: boolean[];
}

export interface Scansion {
  line: string;
  words: ScannedWord[];
  syllableCount: number;
  stresses: boolean[];
  isIambicPentameter: boolean;
  feet: string[]; // e.g. ["˘/", "˘/", "/˘", ...]
  deviations: string[];
  notation: string; // e.g. "˘ / ˘ / ˘ / ˘ / ˘ /"
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z']/g, "");
  if (!w) return 0;
  // Elision-aware-ish vowel group counting.
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  // silent trailing e (but keep 'the', 'she' etc. via min 1)
  if (w.length > 2 && w.endsWith("e") && !/[aeiouy]e$/.test(w)) {
    // crude: subtract silent e unless preceded by 'l' consonant cluster (little)
    if (!/[^aeiou]le$/.test(w)) n = Math.max(1, n - 1);
  }
  // common -ed that is not a syllable (walk'd handled by apostrophe already)
  if (/[^aeiou]ed$/.test(w) && !/(t|d)ed$/.test(w)) n = Math.max(1, n - 1);
  return Math.max(1, n);
}

// Very rough word stress: monosyllables stress unless a function word; longer
// words carry a primary stress we place on the first non-schwa-ish syllable.
function wordStress(word: string, syllables: number): boolean[] {
  const w = word.toLowerCase().replace(/[^a-z']/g, "");
  if (syllables <= 1) return [!FUNCTION_WORDS.has(w)];
  // default: stress the first syllable for disyllables, second-to-last leaning
  // for longer — good enough as a talking point, not a phonology engine.
  const pattern = new Array(syllables).fill(false);
  if (syllables === 2) {
    pattern[0] = true;
  } else {
    pattern[syllables - 2] = true;
    pattern[0] = true;
  }
  return pattern;
}

export function scanLine(rawLine: string): Scansion {
  const line = rawLine.trim();
  const tokens = line.split(/\s+/).filter(Boolean);
  const words: ScannedWord[] = [];
  const stresses: boolean[] = [];

  for (const tok of tokens) {
    const clean = tok.replace(/[.,;:!?'"—\-]+$/g, "").replace(/^[.,;:!?'"—\-]+/g, "");
    if (!clean) continue;
    const syl = countSyllables(clean);
    const pattern = wordStress(clean, syl);
    words.push({ word: clean, syllables: syl, stressPattern: pattern });
    stresses.push(...pattern);
  }

  const syllableCount = stresses.length;

  // Build feet (pairs of syllables) and notation.
  const feet: string[] = [];
  for (let i = 0; i < stresses.length; i += 2) {
    const a = stresses[i] ? "/" : "˘";
    const b = i + 1 < stresses.length ? (stresses[i + 1] ? "/" : "˘") : "";
    feet.push(a + b);
  }
  const notation = stresses.map((s) => (s ? "/" : "˘")).join(" ");

  const deviations: string[] = [];
  if (syllableCount !== 10) {
    deviations.push(
      syllableCount < 10
        ? `Short line: ${syllableCount} syllables where the verse expects ten. A caught breath, or a shared line.`
        : `Long line: ${syllableCount} syllables. An extra beat pressing against the frame.`,
    );
  }
  // Trochaic first foot ("/˘"), the classic Shakespearean opening substitution.
  if (feet[0] === "/˘") {
    deviations.push("The first foot is inverted: the line opens on a stress, punching the first word.");
  }
  // Spondee-ish (two stresses in a foot).
  feet.forEach((f, i) => {
    if (f === "//") deviations.push(`Foot ${i + 1} lands two stresses together. Weight, emphasis, a place the actor leans.`);
  });

  const isIambicPentameter =
    syllableCount === 10 && feet.every((f, i) => (i < 5 ? f === "˘/" : true));

  return {
    line,
    words,
    syllableCount,
    stresses,
    isIambicPentameter,
    feet,
    deviations,
    notation,
  };
}

// A compact human summary an avatar prompt can weave into a turn.
export function scansionSummary(s: Scansion): string {
  const base = `${s.syllableCount} syllables · ${s.notation}`;
  if (s.isIambicPentameter && s.deviations.length === 0) {
    return `${base} — regular iambic pentameter.`;
  }
  return `${base}. ${s.deviations.join(" ")}`;
}
