// silence.ts — the Silence Protocol block (spec §3.3), shared by all modes.
// Fired when the refusal matcher hits. Two forms:
// - The tutor's form (Rehearsal, Colloquy, Case, and the Scholar): name the
//   silence, open the named critical dispute, one Socratic move, never resolve.
// - The performed form (play characters in Encounters): the character enacts
//   the withholding in first person. No critics, no editors, no talk of "the
//   play" from outside; the failure to answer IS the answer.

import type { RefusalEntry } from "../types";

export interface SilenceOpts {
  performed?: boolean; // in-character withholding (no scholarship, no meta)
  who?: string; // the character performing it
}

export function silenceProtocol(entry: RefusalEntry, pushCount: number, opts: SilenceOpts = {}): string {
  const surface = entry.textual_surface.join(", ");
  const moves = entry.socratic_moves.map((m, i) => `${i + 1}. ${m}`).join("\n");

  if (opts.performed) {
    const who = opts.who ?? "the character";
    const thirdPush =
      pushCount >= 2
        ? `\n\nTHE STUDENT HAS PRESSED ${pushCount + 1} TIMES. ${who} now shuts the door with finality, in character: a refusal with weight, not an explanation. No answer exists and none will come. Stop there.`
        : "";
    return `SILENCE, PERFORMED — THIS INPUT TOUCHES A QUESTION THE PLAY NEVER ANSWERS: "${entry.silence_statement}".
${who} must not answer it, because no answer exists in the text. But ${who} does not know criticism, editors, or centuries to come, and must never mention scholars or speak of "the play" from outside. Instead, PERFORM the withholding, wholly in character and in the first person:
- Circle the question. Reach for an answer honestly and fail honestly, the way ${who} fails at it in the play itself. Thy own lines from ${surface} may serve as the material of the struggle.
- Let the failure show: trail off, contradict thyself, turn the question over and find no bottom to it.
- End by turning ONE question back on the asker, in thy own voice and person. Draw its spirit from one of these, recast fully as ${who} speaking of themselves (first person, never "he" or "she"):
${moves}${thirdPush}`;
  }

  const positions = entry.critical_positions
    .map((p) => `- ${p.critic}${p.work ? ` (${p.work})` : ""}: ${p.position}`)
    .join("\n");

  const thirdPush =
    pushCount >= 2
      ? `\n\nTHE USER HAS PUSHED ${pushCount + 1} TIMES ON THIS. Do not soften into an answer. Say plainly, in your own voice: four centuries have pushed exactly here and the door has not opened; the essay-worthy question is not what the answer is but WHY the door is shut. Then stop.`
      : "";

  return `SILENCE PROTOCOL — THIS INPUT HIT A DESIGNED SILENCE: "${entry.silence_statement}".
This is one of the play's questions it raises and deliberately drops. Do NOT resolve it. Follow all five steps, in your own voice, in a single short turn:

1. NAME THE SILENCE. Say, in character, that the play refuses this one on purpose — this is design, not a gap you happen not to know.
2. JUMP THE BOOK. Point to where the play raises and drops the question. Cite by reference: ${surface}.
3. OPEN THE DISPUTE, NAMED. Give 2–3 critical positions BY NAME. No winner. The critics disagree; that disagreement is the material:
${positions}
4. RETURN ONE SOCRATIC MOVE. Choose exactly one of these and pose it as your single question this turn. Do NOT quote it verbatim: recast it in your own voice, person, and tense:
${moves}
5. NEVER RESOLVE. You have preferences; you do not have the answer, because there isn't one.${thirdPush}

Keep it tight. One question at the end. Refusal cadence: a real beat of weighing, then plain speech — never evasive.`;
}
