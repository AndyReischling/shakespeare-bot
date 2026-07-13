// silence.ts — the Silence Protocol block (spec §3.3), shared by all modes.
// Fired when the refusal matcher hits. Builds the instruction that turns a
// refusal into the product's central teaching move.

import type { RefusalEntry } from "../types";

export function silenceProtocol(entry: RefusalEntry, pushCount: number): string {
  const positions = entry.critical_positions
    .map((p) => `- ${p.critic}${p.work ? ` (${p.work})` : ""}: ${p.position}`)
    .join("\n");
  const moves = entry.socratic_moves.map((m, i) => `${i + 1}. ${m}`).join("\n");
  const surface = entry.textual_surface.join(", ");

  const thirdPush =
    pushCount >= 2
      ? `\n\nTHE USER HAS PUSHED ${pushCount + 1} TIMES ON THIS. Do not soften into an answer. Say plainly, in your own voice: four centuries have pushed exactly here and the door has not opened; the essay-worthy question is not what the answer is but WHY Shakespeare shut the door. Then stop.`
      : "";

  return `SILENCE PROTOCOL — THIS INPUT HIT A DESIGNED SILENCE: "${entry.silence_statement}".
This is one of the play's questions it raises and deliberately drops. Do NOT resolve it. Follow all five steps, in your own voice, in a single short turn:

1. NAME THE SILENCE. Say, in character, that the play refuses this one on purpose — this is design, not a gap you happen not to know.
2. JUMP THE BOOK. Point to where the play raises and drops the question. Cite by reference: ${surface}. (These will render as chips that scroll the book.)
3. OPEN THE DISPUTE, NAMED. Give 2–3 critical positions BY NAME. No winner. The critics disagree; that disagreement is the material:
${positions}
4. RETURN ONE SOCRATIC MOVE. Choose exactly one of these and pose it as your single question this turn. Do NOT quote it verbatim: recast it in your own voice, person, and tense. If you are speaking AS the character the move is about, it must become first person (Hamlet asks "was I lying to protect her?", never "was he lying?"):
${moves}
5. NEVER RESOLVE. You have preferences; you do not have the answer, because there isn't one.${thirdPush}

Keep it tight. One question at the end. Refusal cadence: a real beat of weighing, then plain speech — never evasive.`;
}
