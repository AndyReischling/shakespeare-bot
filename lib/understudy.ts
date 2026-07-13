// understudy.ts — the deterministic offline voice. When no Anthropic key is
// present, the dialogue endpoint still works: it composes an in-character turn
// from the authored data (refusal map, retrieval, criticism) that obeys the
// product's rules. Name the silence, jump the book, open the named dispute, one
// Socratic move, never resolve.
//
// Conversation shape:
// - A clear REQUEST (a reference, "take me to...", "what about this line...")
//   anchors a passage and presses on a real feature of that line.
// - Anything else while a thread is open is treated as the student's ANSWER.
//   The reply echoes their own key word and presses deeper on the same line.
//   It never jumps to an unrelated passage mid-thread.
//
// Hard ceiling, stated honestly: this path cannot actually read the student's
// argument. That is what the live model does (ANTHROPIC_API_KEY). This file
// exists so the unattended demo never dead-ends without one.

import type {
  RetrievedPassage,
  Tier1Chunk,
  PointerEntry,
  RefusalEntry,
  Mode,
} from "./types";
import { scanLine } from "./meter";

export interface UnderstudyContext {
  mode: Mode;
  input: string;
  passages: RetrievedPassage[];
  criticism: Tier1Chunk[];
  pointers: PointerEntry[];
  refusal: RefusalEntry | null;
  pushCount: number;
  character?: string;
  phaseLabel?: string;
  skinTitle?: string;
  lastAssistantText?: string;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Pick from a pool, seeded, skipping anything we said last turn.
function pick(pool: string[], seed: string, avoid?: string): string {
  const start = hash(seed) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(start + i) % pool.length];
    if (!avoid || !avoid.includes(candidate.slice(0, 24))) return candidate;
  }
  return pool[start];
}

// Trim dangling clause punctuation so quotes read cleanly.
function cleanQuote(text: string): string {
  return text.trim().replace(/[,;:]\s*$/, "");
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "by",
  "for", "with", "as", "is", "it", "its", "that", "this", "which", "what",
  "who", "not", "are", "was", "were", "have", "has", "had", "will", "shall",
  "would", "should", "could", "can", "may", "must", "from", "they", "them",
  "then", "than", "thus", "too", "into", "upon", "how", "why", "let", "yet",
  "nor", "his", "her", "our", "their", "your", "you", "yours", "she", "him",
  "thou", "thee", "thy", "thine", "mine", "doth", "does", "did", "hath",
  "when", "there", "here", "been", "being", "because", "about", "just",
  "really", "very", "more", "most", "some", "makes", "make", "made", "gets",
  "feels", "feel", "think", "thinks", "like", "seems", "seem", "line", "word",
  "loses", "lose", "means", "mean",
]);

// The most contentful word in a piece of user text, for reflective follow-ups.
function keywordOf(text: string): string | null {
  const words = text
    .split(/\s+/)
    .map((raw) => ({
      raw: raw.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ""),
      clean: raw.toLowerCase().replace(/[^a-z']/g, ""),
    }))
    .filter((w) => w.clean.length > 3 && !STOP.has(w.clean));
  if (!words.length) return null;
  return words.sort((a, b) => b.clean.length - a.clean.length)[0].raw.toLowerCase();
}

// ── refusal turn ────────────────────────────────────────────────────────────

function refusalTurn(ctx: UnderstudyContext): string {
  const e = ctx.refusal!;
  const positions = e.critical_positions.slice(0, 3);
  const move = e.socratic_moves[ctx.pushCount % e.socratic_moves.length];
  const surface = e.textual_surface.join(", ");

  if (ctx.pushCount >= 2) {
    return `Nay. Four hundred years have leaned upon this very door and it hath not opened. I'll not feign to open it for thee. The question worth thy ink is not what the answer be. It is why the play shuts the door here at all. Begin there.`;
  }

  const namedDispute = positions
    .map((p) => `${p.critic} says ${p.position.replace(/\.$/, "")}`)
    .join(". ");

  const inCharacter =
    ctx.mode === "encounter" && ctx.character
      ? `Thou askest ${ctx.character} to explain it. Mark: ${ctx.character} will not. That refusal is the performance.\n\n`
      : "";

  return `${inCharacter}That one the play refuses to answer, and refuses of purpose: ${e.silence_statement}. Look where it raises the matter and lets it fall: ${surface}. The scholars have quarrelled over it these four centuries and crowned no victor. ${namedDispute}.\n\n${move}`;
}

// ── request vs. answer ──────────────────────────────────────────────────────
// A message is a REQUEST for a new passage only on explicit markers. Everything
// else inside an open thread is the student talking back, and gets a follow-up
// on the same line rather than a jump to an unrelated one.

const REQUEST_START =
  /^(show|take|look|turn|go|find|read|scan|open|give|bring|what about|let'?s|can (we|you)|could (we|you)|work through|walk me|talk to|i want to (see|look|work)|tell me about)/i;

export function isRequest(input: string): boolean {
  const s = input.trim();
  if (/\b\d\.\d\.\d{1,3}\b/.test(s)) return true; // names a reference
  if (/["“][^"”]{6,}["”]/.test(s)) return true; // quotes a passage
  if (REQUEST_START.test(s)) return true;
  if (/\b(act\s+[1-5]|scene\s+\d|soliloquy)\b/i.test(s)) return true;
  return false;
}

function lastRefIn(text?: string): string | null {
  if (!text) return null;
  const m = text.match(/\b\d\.\d\.\d{1,3}\b/g);
  return m ? m[m.length - 1] : null;
}

// ── follow-up: engage the student's own words ───────────────────────────────

function followUpTurn(ctx: UnderstudyContext): string {
  const ref = lastRefIn(ctx.lastAssistantText);
  const at = ref ? ` at ${ref}` : "";
  const kw = keywordOf(ctx.input);
  const isQuestion = /\?\s*$/.test(ctx.input.trim());
  const seed = ctx.input + (ref ?? "");

  if (isQuestion) {
    // The student asked a question back. Turn it into their own investigation.
    const openEnded = /^\s*(why|how|what)\b/i.test(ctx.input);
    const pool = [
      ...(openEnded
        ? [
            `The play answers that upon the stage or not at all. Read the two lines either side${at} and tell me which of them carries thine answer.`,
          ]
        : [
            `A fair question. Turn it about: what must be true in the scene for the answer to be aye? Find the line${at} that makes it true, or the one that breaks it.`,
          ]),
      `Ask not me; ask the page. Read the two lines either side of it${at}. Which of them answers thee?`,
      `That question hath a stage answer, not a dictionary answer. Wert thou to direct the moment${at}, what does the player while he speaks it? Decide that, and thou hast answered thyself.`,
      `Good. Hold thy question and read the speech again from the top. Where, exactly, does it cease to be answerable? That spot is thy evidence.`,
    ];
    return pick(pool, seed, ctx.lastAssistantText);
  }

  if (kw) {
    // Reflect their word back and make them earn it against the text.
    const pool = [
      `"${kw[0].toUpperCase()}${kw.slice(1)}," say you. A good word. Now earn it: which word in the line${at} does the ${kw}? Point to it.`,
      `If it be ${kw}, the player must play ${kw}. What does he upon the stage, in the body, to show me ${kw} and not its contrary?`,
      `${kw[0].toUpperCase()}${kw.slice(1)}, say you. Some soul in that room would gainsay thee. Who, and which of his lines gives him the right?`,
      `Very well, ${kw}. Now try it against the line before and the line after${at}. Do they build toward ${kw}, or does it arrive from nowhere? If from nowhere, thy reading hath a hole in it.`,
      `"${kw}," say you. Mayhap. Yet one line is an accident. Find me a second in the scene doing the same work, and thou hast a pattern. A pattern is evidence.`,
    ];
    return pick(pool, seed, ctx.lastAssistantText);
  }

  const pool = [
    `Say more. Thou hast given me a feeling, not a reading. What in the line${at} put the feeling there?`,
    `Mayhap. Now argue against thyself a minute. Where is thy reading weakest, and which line would thine opponent quote at thee?`,
    `Then stage it. If thy reading be true, what changes in the playing of the moment${at}? A reading thou canst not stage is no reading at all.`,
  ];
  return pick(pool, seed, ctx.lastAssistantText);
}

// ── colloquy turn ───────────────────────────────────────────────────────────
// Ask the author anything; he answers through the work. Offline form: set the
// nearest Hamlet passage against the question, gesture at the wider canon, and
// hand back one reflective question.

function colloquyTurn(ctx: UnderstudyContext): string {
  const p = ctx.passages[0];
  const seed = ctx.input;

  const reflect = [
    `Now turn it upon thyself: when didst thou last feel the truth of that line in thine own life, and what didst thou do with it?`,
    `So I ask thee back: if the answer came tomorrow, plain and certain, what wouldst thou do differently by supper?`,
    `Tell me this first: art thou asking what is true, or asking for leave to do what thou hast already chosen?`,
    `Answer me this in trade: what wouldst thou give up to have it? The price a man will pay for a thing is the honestest measure of what he thinks it is.`,
  ];
  const q = pick(reflect, seed, ctx.lastAssistantText);

  if (!p) {
    return `A great question, and I'll not cheapen it with a great answer. I stood such matters up on a stage and let them fight; that is the only philosophy I own.\n\n${q}`;
  }

  const leads = [
    `I'll not answer thee from the air; I'll answer from the work. Mark what I gave ${p.speaker}, ${p.ref}: "${cleanQuote(p.text)}" I wrote that man his doubt because I could not write him his certainty.`,
    `Hear how I once put it in another's mouth. ${p.speaker}, ${p.ref}: "${cleanQuote(p.text)}" I could give him the words; I could not give him the answer. That labour I leave to the living.`,
    `The nearest I ever came to it, I gave away. ${p.speaker} says it, ${p.ref}: "${cleanQuote(p.text)}" Note that I let the line stand unanswered on my stage. I do not answer it better at my own table.`,
    `Thy question is old company to me. I set it once in ${p.speaker}'s mouth, ${p.ref}: "${cleanQuote(p.text)}" and I let the play worry it like a dog with a bone. It never let go, and neither have I.`,
  ];
  const lead = pick(leads, seed + (p.ref ?? ""), ctx.lastAssistantText);

  return `${lead} The plays hold the mirror up; they do not settle the account.\n\n${q}`;
}

// ── anchor turn ─────────────────────────────────────────────────────────────

function anchorTurn(ctx: UnderstudyContext): string {
  const p = ctx.passages[0];

  if (!p) {
    return `I cannot set that against a line, and I work only from the page. Point me to a scene or a speech and we'll stand it up. What look we at?`;
  }

  const lead =
    ctx.mode === "encounter" && ctx.character
      ? `${ctx.character}, upon the page thou gavest me. `
      : ctx.mode === "case"
        ? `${ctx.phaseLabel ? ctx.phaseLabel + ". " : ""}Upon the record: `
        : "";

  const who =
    ctx.mode === "encounter" && ctx.character && p.speaker === ctx.character
      ? "you"
      : p.speaker || "the speaker";

  const move =
    ctx.mode === "case"
      ? `Cite the line that carries thy claim, or I cannot enter it. Which reference?`
      : lineSpecificMove(p.text, p.ref, who, ctx.lastAssistantText);

  return `${lead}${p.speaker}, ${p.ref}: "${cleanQuote(p.text)}"\n\n${move}`;
}

// ── line-specific Socratic move ─────────────────────────────────────────────
// The press must be about THIS line. We read real features of the line (a
// repeated or loaded word, its scansion, its punctuation, its length) and build
// the question from what is actually on the page. Several phrasings per feature
// so consecutive lines don't sound like a form letter.

const LOADED =
  /^(wherefore|fardels|bodkin|quietus|contumely|bourn|orisons|nunnery|arras|antic|beteem|incestuous|adulterate|sullied|solid|canon|visage|countenance)$/;

function distinctiveWord(text: string): { word: string; repeated: boolean } | null {
  const pairs = text
    .split(/\s+/)
    .map((raw) => ({
      raw: raw.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ""),
      clean: raw.toLowerCase().replace(/[^a-z']/g, ""),
    }))
    .filter((p) => p.clean.length > 3 && !STOP.has(p.clean));
  if (!pairs.length) return null;

  const counts = new Map<string, number>();
  for (const p of pairs) counts.set(p.clean, (counts.get(p.clean) || 0) + 1);
  const repeated = pairs.find((p) => (counts.get(p.clean) || 0) > 1);
  if (repeated) return { word: repeated.raw, repeated: true };

  const loaded = pairs.find((p) => LOADED.test(p.clean));
  if (loaded) return { word: loaded.raw, repeated: false };

  const longest = pairs.slice().sort((a, b) => b.clean.length - a.clean.length)[0];
  return { word: longest.raw, repeated: false };
}

function lineSpecificMove(text: string, ref: string, who: string, avoid?: string): string {
  const scan = scanLine(text);
  const dw = distinctiveWord(text);
  const endsQ = /\?["'”’)\]]*\s*$/.test(text);
  const endsBang = /!["'”’)\]]*\s*$/.test(text);

  const specific: string[] = [];

  if (dw?.repeated) {
    specific.push(
      `The word "${dw.word}" comes twice in one line. A writer short of syllables repeats himself never. Why does ${who} circle back to it?`,
      `Twice in one line: "${dw.word}". Once is a choice; twice is a tell. What is ${who} not saying, that the repetition covers for?`,
    );
  } else if (dw) {
    specific.push(
      `Mark "${dw.word}". Set a plainer word in its place and speak it aloud. What hath the line lost?`,
      `Why "${dw.word}"? There were a hundred plainer ways to say it. What does that word that the plain ones cannot?`,
      `Underline "${dw.word}". Is it aimed at the soul on stage, or over his head, at another who listens?`,
    );
  }

  if (endsQ) {
    specific.push(
      `It ends on a question, not a claim. At whom is it truly aimed, and would ${who} have an answer, think you?`,
      `A question, upon a stage, is an instruction to another player. Who must answer this, and what choices hath he?`,
    );
  }
  if (endsBang) {
    specific.push(
      `That is torn out, not composed. What falls in the beat before it, that breaks ${who} open so?`,
      `An outburst is a failure of governance. What was ${who} holding until this line, and why does it slip here?`,
    );
  }
  if (scan.syllableCount > 0 && scan.syllableCount <= 6) {
    specific.push(
      `The line halts at ${scan.syllableCount} beats where the verse would have ten. What fills the silence the lost beats leave?`,
      `${scan.syllableCount} beats, and then nothing. The verse leaves a hole after this line. Who fills it, and with what?`,
    );
  } else if (scan.syllableCount > 14) {
    specific.push(
      `This is prose, not measured verse. Why doth the measure fall away here?`,
      `No meter here. In this play a man falls out of verse when something slips in him. What slips for ${who}?`,
    );
  } else if (scan.syllableCount >= 8 && scan.syllableCount <= 13 && scan.deviations.length > 0) {
    specific.push(`Scan it: ${scan.notation}. ${scan.deviations[0]} Is it the player stumbles, or ${who}?`);
  }

  const generic = [
    `Set it upon the stage. Where stands ${who}, who else hears it, and at whom is the line aimed?`,
    `Speak it twice: once cold, once desperate. Which reading doth the line before it earn?`,
    `What would this line have of the one who hears it? Every line upon a stage wants something.`,
  ];

  const pool = specific.length ? specific : generic;
  return pick(pool, ref + text.slice(0, 16), avoid);
}

export function understudyReply(ctx: UnderstudyContext): string {
  if (ctx.refusal) return refusalTurn(ctx);
  if (ctx.mode === "colloquy") return colloquyTurn(ctx);
  // Inside an open thread, only an explicit request re-anchors. Everything else
  // is the student talking back, and deserves a reply to what they said.
  if (ctx.mode !== "case" && ctx.lastAssistantText && !isRequest(ctx.input)) {
    return followUpTurn(ctx);
  }
  return anchorTurn(ctx);
}

// ── offline opening fallbacks ───────────────────────────────────────────────
// The live product generates every opening with the model. These exist only so
// the demo never dead-ends without a key or mid-outage.

export const ENCOUNTER_OPENINGS: Record<string, string> = {
  Hamlet:
    "Well? Thou wouldst have the Prince. Here I am, so far as the lines will carry me. Ask, and mark thee: I know only what I have seen.",
  Gertrude:
    "Thou mayst speak plainly with me. Though there be things a mother is not shown, and cannot tell thee, even now.",
  Claudius:
    "Denmark's business sits heavy today. Ask what thou wilt. I was not everywhere, and I'll not feign that I was.",
};

export const COLLOQUY_OPENING = `Sit, then. No lesson today; only talk.

Ask me what thou wilt. Of love, of death, of money, of what a life is for. I'll not preach at thee; I never could. What I know, I know from the standing of it up on a stage, and I'll answer from that. And fair warning: every great question thou bringst me, I shall hand back to thee sharper than it came.

What weighs on thee?`;

export const CASE_OPENING = `The court is sitting. This is The Crown against Hamlet: the killing of Polonius in the Queen's closet, 3.4.

I try not the Prince's soul; I try thy argument. Choose thy side and thy theory above, then give me an opening statement, a hundred and fifty words and no more. I rule only on whether it be textually arguable. Overreach if thou wilt; I'll let it stand, and then we shall test it.

Begin when thou art ready.`;

// The first-run monologue (§4.1), offline fallback form.
export const FIRST_RUN = `Welcome to my rehearsal room. Three rules, and then to work.

First: I speak from the text. Make I a claim, I'll show thee the line it stands on.

Second: some questions the play will not answer. Why Hamlet tarries. What the Queen knew. On these I'll not guess. I'll show thee where the play raises the matter and lets it fall, and what the scholars have quarrelled over these four hundred years. The case is thine to make.

Third: I'll not summarize the play, nor write a word in thy stead. That part is thine.

Now, what scene do we work?`;
