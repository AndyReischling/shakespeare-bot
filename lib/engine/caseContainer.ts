// caseContainer.ts — the skin-agnostic pedagogical state machine (spec §5).
// The architecture argument of the whole proposal: four invariant properties —
// Position, Resistance, Diegetic discipline, Whole-argument closing — expressed
// as a generic phase machine that any genre's skin can costume.

import trialSkin from "./skins/trial.hamlet.json";
import persuasionSkin from "./skins/persuasion.twelfthnight.json";
import pitchSkin from "./skins/pitch.universal.json";
import type { Skin } from "../types";

export type PhaseKind = "POSITION" | "CHALLENGE" | "EVIDENCE" | "CLOSING";

export interface PhaseDef {
  kind: PhaseKind;
  id: string;
  label: string;
  instruction: string; // one-line self-guiding instruction shown to the user
  advanceLabel: string; // always-visible advance action (no state may dead-end)
}

export interface ResistanceAgent {
  id: string;
  label: string;
  constraints: string;
}

export interface SkinDef {
  skin: Skin;
  title: string;
  subtitle: string;
  status: "build" | "schema-only";
  adjudicatorOverlay: string;
  challengeRounds: number;
  phases: PhaseDef[];
  resistanceAgents: ResistanceAgent[];
  admissibilityRubric: string;
  evidenceRubric: string; // supports / consistent-with / contradicts
  closingTemplate: string;
  positionOptions?: { id: string; label: string }[];
  theories?: { id: string; label: string }[];
}

const SKINS: Record<Skin, SkinDef> = {
  trial: trialSkin as unknown as SkinDef,
  persuasion: persuasionSkin as unknown as SkinDef,
  pitch: pitchSkin as unknown as SkinDef,
};

export function loadSkin(skin: Skin): SkinDef {
  return SKINS[skin];
}

export function phaseById(skin: SkinDef, id: string): PhaseDef | undefined {
  return skin.phases.find((p) => p.id === id);
}

export function firstPhase(skin: SkinDef): PhaseDef {
  return skin.phases[0];
}

// Generic advance: POSITION -> CHALLENGE (repeated n) -> EVIDENCE -> CLOSING.
// Challenge rounds are tracked by the caller (round count in session); the engine
// just returns the next phase id given the current one and the round counter.
export function nextPhase(
  skin: SkinDef,
  currentId: string,
  challengeRoundsDone: number,
): { phase: PhaseDef; done: boolean } {
  const idx = skin.phases.findIndex((p) => p.id === currentId);
  const current = skin.phases[idx];
  if (!current) return { phase: firstPhase(skin), done: false };

  if (current.kind === "CHALLENGE" && challengeRoundsDone + 1 < skin.challengeRounds) {
    // stay in the challenge phase for another round
    return { phase: current, done: false };
  }
  const next = skin.phases[idx + 1];
  if (!next) return { phase: current, done: true };
  return { phase: next, done: false };
}

export function isSchemaOnly(skin: SkinDef): boolean {
  return skin.status === "schema-only";
}

// Phase tracker for the UI.
export function tracker(skin: SkinDef, currentId: string): { label: string; active: boolean; done: boolean }[] {
  const idx = skin.phases.findIndex((p) => p.id === currentId);
  return skin.phases.map((p, i) => ({
    label: p.label,
    active: i === idx,
    done: i < idx,
  }));
}
