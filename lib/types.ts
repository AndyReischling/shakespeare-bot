// Shared types for The Rehearsal Room.

export type Mode = "rehearsal" | "encounter" | "case";
export type Skin = "trial" | "persuasion" | "pitch";
export type Register = "conversational" | "performance" | "refusal" | "judge";

export interface Line {
  ftln: number;
  ref: string; // human-facing act.scene.line ("" for stage directions)
  act: number;
  scene: number;
  speaker: string; // "" for stage directions
  text: string;
  onstage: string[];
  notes_ref: string[];
  sd?: boolean; // true for stage directions (not citable, rendered as italics)
}

export interface SceneMeta {
  id: string;
  act: number;
  scene: number;
  title: string;
  summary: string;
}

export interface Hamlet {
  work: string;
  author: string;
  source: Record<string, unknown>;
  scenes: SceneMeta[];
  lines: Line[];
}

export interface CriticalPosition {
  critic: string;
  work?: string;
  position: string;
}

export interface RefusalEntry {
  id: string;
  silence_statement: string;
  question_patterns: string[];
  textual_surface: string[];
  critical_positions: CriticalPosition[];
  socratic_moves: string[];
}

export interface RefusalMatch {
  entry: RefusalEntry;
  score: number;
  method: "similarity" | "classifier" | "none";
}

export interface Tier1Chunk {
  id: string;
  critic: string;
  work: string;
  year: number;
  ftln_focus: string[];
  text: string;
}

export interface PointerEntry {
  author: string;
  work: string;
  year: number;
  position: string;
  topics: string[];
  ftln_ranges: string[];
}

export interface RetrievedPassage {
  ftln: number;
  ref: string;
  speaker: string;
  text: string;
  score: number;
  scene: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DialogueRequest {
  mode: Mode;
  skin?: Skin;
  phase?: string;
  character?: string; // for encounter mode
  history: ChatTurn[];
  input: string;
}

// A citation the client renders as a chip that jumps the book pane.
export interface Citation {
  ref: string;
  ftln?: number;
}
