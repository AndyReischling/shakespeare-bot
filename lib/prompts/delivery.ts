// delivery.ts — two registers, one voice (spec §7.3). Register is a prompting
// artifact layered over a single designed voice, not a second voice. These
// templates wrap text for the (pre-rendered / future live) TTS payload and mark
// the audible gearshift that signals a quotation boundary by ear.

import type { Register } from "../types";

export interface DeliveryPayload {
  register: Register;
  text: string;
  direction: string; // spoken-delivery direction for the TTS engine / voice actor
  pauseBeforeMs: number;
  pauseAfterMs: number;
}

export function deliver(register: Register, text: string): DeliveryPayload {
  switch (register) {
    case "performance":
      // Any quoted line: measured, weighted, a beat of silence either side.
      return {
        register,
        text,
        direction:
          "Measured pace. Give the line weight. A beat of silence before and after — this is a quotation; let the gearshift be audible.",
        pauseBeforeMs: 550,
        pauseAfterMs: 650,
      };
    case "refusal":
      // A genuine pause before a Silence Protocol response — a director weighing
      // the question, not a bot evading it.
      return {
        register,
        text,
        direction:
          "Pause first, as a man genuinely weighing a hard question. Then speak plainly, unhurried — not evasive, deliberate.",
        pauseBeforeMs: 900,
        pauseAfterMs: 300,
      };
    case "judge":
      return {
        register,
        text,
        direction: "Slower, formal, faintly amused. The cadence of a man enjoying the ruling.",
        pauseBeforeMs: 400,
        pauseAfterMs: 300,
      };
    case "conversational":
    default:
      return {
        register,
        text,
        direction: "Natural pace, dry, unforced. Conversational — the everyday register.",
        pauseBeforeMs: 150,
        pauseAfterMs: 200,
      };
  }
}
