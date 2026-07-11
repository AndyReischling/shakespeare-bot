import { NextRequest } from "next/server";
import {
  hasAnthropic,
  client,
  MODEL,
} from "@/lib/anthropic";
import { matchRefusal, matchRefusalLexical } from "@/lib/refusal";
import {
  retrievePassages,
  retrieveCriticism,
  retrievePointers,
} from "@/lib/retrieval";
import { scenesWitnessedBy } from "@/lib/corpus";
import {
  buildRehearsalPrompt,
  buildEncounterPrompt,
  buildCasePrompt,
  PromptContext,
} from "@/lib/prompts";
import { loadSkin, phaseById } from "@/lib/engine/caseContainer";
import {
  understudyReply,
  UnderstudyContext,
  FIRST_RUN,
  ENCOUNTER_OPENINGS,
  CASE_OPENING,
} from "@/lib/understudy";
import { verifyOutput, correctionInstruction, extractCitations } from "@/lib/textLicense";
import { deliver } from "@/lib/prompts/delivery";
import { checkAccess, checkRate, checkDailyCap, noteApiCall, clientIp } from "@/lib/ops";
import { logTurn } from "@/lib/log";
import type { DialogueRequest, ChatTurn, Register, Skin } from "@/lib/types";

export const runtime = "nodejs";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// The model slips em dashes past the prompt ban. Strip them outside quoted
// spans (quoted play text must stay verbatim for the citation checker).
function stripEmDashes(text: string): string {
  const parts = text.split(/(["“][^"”]*["”])/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // quoted span, leave verbatim
      return part
        .replace(/\s*[—–]\s*/g, ", ")
        .replace(/,\s*,/g, ",")
        .replace(/([.!?:;])\s*,\s*/g, "$1 ");
    })
    .join("");
}

// Count how many recent user turns leaned on the same silence (drives the
// "third push" escalation of the Silence Protocol, §3.3).
function countPush(history: ChatTurn[], silenceId: string): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role !== "user") continue;
    const m = matchRefusalLexical(history[i].content);
    if (m.entry && m.entry.id === silenceId) n++;
    else break;
  }
  return n;
}

async function anthropicText(system: string, messages: ChatTurn[]): Promise<string> {
  noteApiCall();
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 900,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export async function POST(req: NextRequest) {
  let body: DialogueRequest;
  try {
    body = (await req.json()) as DialogueRequest;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const access = checkAccess(req.headers.get("x-access-token"));
  if (!access.ok) return new Response(access.reason, { status: access.status });

  const ip = clientIp(req.headers);
  const rate = checkRate(ip);
  if (!rate.ok) return new Response(rate.reason, { status: rate.status });

  const { mode, skin, phase, character, history = [], input } = body;
  if (!input || !mode) return new Response("Missing input or mode", { status: 400 });

  // No fixed copy: the first turn of every room is generated too. An opening
  // request skips refusal matching and retrieval and carries its own instruction.
  const isOpening = input === "__OPENING__";

  // 1. Refusal matching (all modes) — the differentiating step. In Encounters the
  //    user addresses the character in second person ("why do YOU delay"), so we
  //    seed the character's name for the name-aware matcher.
  const matchInput =
    mode === "encounter" && character ? `${character} ${input}` : input;
  const match = isOpening
    ? { entry: null as any, score: 0, method: "none" as const }
    : await matchRefusal(matchInput);
  const refusal = match.entry ?? null;
  const pushCount = refusal ? countPush(history, refusal.id) : 0;

  // 2. Retrieval (dual-index; filtered for the encounter knowledge boundary).
  const passages = isOpening
    ? []
    : mode === "encounter" && character
      ? retrievePassages(input, { witnessedScenes: scenesWitnessedBy(character), onlyCharacterKnows: character, topK: 5 })
      : retrievePassages(input, { topK: 5 });
  const criticism = isOpening ? [] : retrieveCriticism(input, 3);
  const pointers = isOpening ? [] : retrievePointers(refusal ? refusal.id : input, 2);

  // 3. Assemble the mode prompt.
  const ctx: PromptContext = { passages, criticism, pointers, refusal, pushCount };
  let system: string;
  let register: Register = refusal ? "refusal" : "conversational";
  let phaseAdvance: { advanceLabel: string; nextPossible: boolean } | null = null;

  if (mode === "encounter") {
    ctx.character = character;
    system = buildEncounterPrompt(ctx);
  } else if (mode === "case") {
    const s = loadSkin((skin ?? "trial") as Skin);
    const ph = phase ? phaseById(s, phase) : s.phases[0];
    ctx.skinLabel = s.title;
    ctx.adjudicatorOverlay = s.adjudicatorOverlay;
    ctx.phaseLabel = ph?.label;
    ctx.phaseInstruction = ph?.instruction;
    ctx.rubric =
      ph?.kind === "CHALLENGE"
        ? s.admissibilityRubric
        : ph?.kind === "EVIDENCE"
          ? s.evidenceRubric
          : ph?.kind === "CLOSING"
            ? s.closingTemplate
            : undefined;
    system = buildCasePrompt(ctx);
    register = refusal ? "refusal" : "judge";
    if (ph) phaseAdvance = { advanceLabel: ph.advanceLabel, nextPossible: true };
  } else {
    system = buildRehearsalPrompt(ctx);
  }

  // Opening-turn instruction, appended to the mode prompt.
  if (isOpening) {
    const openingInstruction =
      mode === "encounter"
        ? `OPENING TURN: The student has just entered. Greet them AS ${character ?? "the character"}, in character and in period voice, in three sentences or fewer. Let them feel thy limits: thou knowest only what thou hast witnessed in the play. End by inviting their question. Do not cite line references in this greeting.`
        : mode === "case"
          ? `OPENING TURN: Open the court in thy judge's voice. Name the case and the matter (the killing of Polonius, 3.4). Say plainly that thou triest the argument, not the Prince's soul. Direct them: choose a side and a theory above, then deliver an opening statement of one hundred and fifty words or fewer, which thou wilt rule textually arguable or not. Under 110 words.`
          : `OPENING TURN: The student has just entered thy rehearsal room for the first time. Give thy welcome in thine own words, and in it make three rules plain: thou speakest from the text and wilt show the line for every claim; some questions the play refuses of purpose, and there thou refusest too, offering the critics' quarrel instead of a guess; and thou wilt neither summarize the play nor write a word in the student's stead. End by asking what scene we work. Under 130 words.`;
    system += "\n\n" + openingInstruction;
  }

  // 4. Generate — real model if configured, else the deterministic understudy.
  const messages: ChatTurn[] = isOpening
    ? [{ role: "user", content: "(The student enters.)" }]
    : [...history, { role: "user", content: input }];
  const usedModel = hasAnthropic() && checkDailyCap().ok;

  const offlineReply = () =>
    isOpening
      ? mode === "encounter"
        ? ENCOUNTER_OPENINGS[character ?? ""] ?? FIRST_RUN
        : mode === "case"
          ? CASE_OPENING
          : FIRST_RUN
      : understudyReply(toUnderstudy(ctx, mode, input, history));

  let text: string;
  if (usedModel) {
    try {
      text = stripEmDashes(await anthropicText(system, messages));
    } catch {
      text = offlineReply();
    }
  } else {
    text = offlineReply();
  }

  // 5. Citation verification (Encounter/Case). One regeneration pass on a miss;
  //    fall back to citation-by-reference. Same layer surfaces as objections in Case.
  let licenseOk = true;
  if (mode === "encounter" || mode === "case") {
    const report = verifyOutput(text);
    licenseOk = report.ok;
    if (!report.ok && usedModel) {
      try {
        const corrected = await anthropicText(
          system + "\n\nCORRECTION REQUIRED: " + correctionInstruction(report),
          messages,
        );
        const recheck = verifyOutput(corrected);
        text = corrected;
        licenseOk = recheck.ok;
      } catch {
        /* keep original; client still gets a usable turn */
      }
    }
  }

  // 6. Metadata for the client (citations -> book-jump chips; register -> audio gearshift).
  const citations = extractCitations(text);
  const delivery = deliver(register, text);

  logTurn({
    mode,
    skin,
    phase,
    character,
    refusalId: refusal?.id ?? null,
    refusalMethod: match.method,
    licenseOk,
    usedModel,
    inputLen: input.length,
    outputLen: text.length,
  });

  // 7. Stream the (verified) text to the client as SSE. Verification requires the
  //    full generation, so we generate-then-stream rather than passthrough.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          sse("meta", {
            citations,
            refusal: refusal ? { id: refusal.id, statement: refusal.silence_statement } : null,
            method: match.method,
            score: match.score,
            register,
            delivery: { direction: delivery.direction, pauseBeforeMs: delivery.pauseBeforeMs },
            phaseAdvance,
            usedModel,
            licenseOk,
          }),
        ),
      );
      // token-ish streaming for a live feel
      const parts = text.split(/(\s+)/);
      for (const part of parts) {
        controller.enqueue(encoder.encode(sse("delta", { text: part })));
        // small yield so the client renders progressively
        await new Promise((r) => setTimeout(r, usedModel ? 0 : 12));
      }
      controller.enqueue(encoder.encode(sse("done", { ok: true })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function toUnderstudy(
  ctx: PromptContext,
  mode: DialogueRequest["mode"],
  input: string,
  history: ChatTurn[],
): UnderstudyContext {
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
  return {
    mode,
    input,
    passages: ctx.passages,
    criticism: ctx.criticism,
    pointers: ctx.pointers,
    refusal: ctx.refusal,
    pushCount: ctx.pushCount,
    character: ctx.character,
    phaseLabel: ctx.phaseLabel,
    skinTitle: ctx.skinLabel,
    lastAssistantText: lastAssistant?.content,
  };
}
