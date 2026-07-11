// chips.ts — suggested-prompt trails (spec §4.4). Contextual chips that rotate by
// state and route users onto the strong paths. Chips are suggestions; free input
// always works. They must fit the scene they're in: character-specific in
// Encounters, line-specific once a line is on the table.

import type { Mode } from "./types";

export interface ChipState {
  mode: Mode;
  turnCount: number;
  lastWasRefusal: boolean;
  character?: string;
  phaseKind?: "POSITION" | "CHALLENGE" | "EVIDENCE" | "CLOSING";
  activeRef?: string | null; // the line currently on the table (last citation)
}

// Per-character trails: each aims at that character's strongest material,
// including their designed silences (which fire the refusal protocol).
const CHARACTER_CHIPS: Record<string, string[]> = {
  Hamlet: [
    "Why do you delay your revenge?",
    "Did you know who was behind the arras?",
    "Do you love Ophelia?",
  ],
  Gertrude: [
    "Did you know how your husband died?",
    "Why did you marry so soon after the funeral?",
    "What did you see when Hamlet spoke to the air?",
  ],
  Claudius: [
    "Why did you kill your brother?",
    "Did your prayer bring you any peace?",
    "What do you intend for the Prince?",
  ],
  Ophelia: [
    "Do you believe Hamlet ever loved you?",
    "Why did you give back his letters?",
    "What was he like before all this began?",
  ],
  Ghost: [
    "What are you? Honest spirit, or something else?",
    "Why must it be Hamlet who takes revenge?",
    "What is it like where you are confined?",
  ],
  Horatio: [
    "Do you trust what you saw on the battlements?",
    "Why do you stay loyal to the Prince?",
    "Is Hamlet mad, or playing at it?",
  ],
  Laertes: [
    "Why don't you delay, as Hamlet does?",
    "Was your revenge more just than his?",
    "What would you have done in the Prince's place?",
  ],
};

export function chipsFor(s: ChipState): string[] {
  // After a refusal hit: push toward the critical dispute and the textual surface.
  if (s.lastWasRefusal) {
    return ["What would Bradley say?", "Show me where the play raises this", "So why is the door shut?"];
  }

  if (s.mode === "encounter") {
    const own = CHARACTER_CHIPS[s.character ?? ""] ?? [];
    // A line is on the table: press on it, in this character's presence.
    if (s.activeRef && s.turnCount > 0) {
      return [
        `How else could ${s.activeRef} be played?`,
        own[s.turnCount % Math.max(own.length, 1)] ?? "Why that word?",
        `${s.character}, what were you not saying at ${s.activeRef}?`,
      ];
    }
    return own.length ? own : ["Why that word?", "What do you want in this scene?"];
  }

  if (s.mode === "case") {
    switch (s.phaseKind) {
      case "POSITION":
        return ["The Prince is plainly guilty of murder.", "Diminished capacity — his mind was not his own.", "Manslaughter: he struck at the King, not Polonius."];
      case "CHALLENGE":
        // One deliberately overreaching example question as a chip (§4.4).
        return ["When Hamlet saw it was Polonius, why did he strike anyway?", "Ask the Queen what she knew of the murder", "Ask Hamlet who he thought was behind the arras"];
      case "EVIDENCE":
        return ["Enter 3.4.31 into the record", "Enter 3.4.38 into the record", "Enter 3.4.27 into the record"];
      case "CLOSING":
        return ["Begin a new case"];
      default:
        return ["State your opening"];
    }
  }

  // Rehearsal. A line on the table: the chips work that line.
  if (s.activeRef && s.turnCount > 0) {
    return [
      `Scan ${s.activeRef} for me`,
      `How else could ${s.activeRef} be played?`,
      "What's the counter-scene to this?",
    ];
  }
  if (s.turnCount === 0) {
    return ['Why does Hamlet delay?', "Was Hamlet's madness real?", 'Work through the "To be" speech with me'];
  }
  if (s.turnCount >= 3) {
    return ["Can I talk to Gertrude about the murder?", "Show me the sullied / solid crux", "What would Coleridge say?"];
  }
  return ["Take me to 3.1", "Scan a line for me", "Where does the play drop the question?"];
}
