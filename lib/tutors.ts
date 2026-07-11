// tutors.ts — the roster. This demo ships one tutor (Shakespeare), but the RFP is
// a platform of Socratic AI tutors on one engine. The others are authored the
// same way (persona + corpus + refusal map + case skins) and are named here as
// sequenced Phase-2 work so the platform intent is legible everywhere.

export interface Work {
  id: string;
  title: string;
  kind: string; // tragedy, comedy, dialogue, treatise…
  live?: boolean; // usable in this demo
}

export interface Tutor {
  id: string;
  name: string;
  work: string; // the primary text they teach in this demo
  room: string; // their themed space (the genre chooses its form)
  status: "live" | "planned";
  href?: string;
  blurb: string;
  skin: string; // the case container's native skin for this tutor
  works: Work[]; // the catalog: same process, different work
}

export const TUTORS: Tutor[] = [
  {
    id: "shakespeare",
    name: "William Shakespeare",
    work: "Hamlet",
    room: "The Rehearsal Room",
    status: "live",
    href: "/",
    blurb: "A working director in his own playhouse, teaching the play by making you stage it.",
    skin: "Trial · The Crown v. Hamlet",
    works: [
      { id: "hamlet", title: "Hamlet", kind: "Tragedy", live: true },
      { id: "macbeth", title: "Macbeth", kind: "Tragedy" },
      { id: "lear", title: "King Lear", kind: "Tragedy" },
      { id: "othello", title: "Othello", kind: "Tragedy" },
      { id: "romeo", title: "Romeo and Juliet", kind: "Tragedy" },
      { id: "twelfthnight", title: "Twelfth Night", kind: "Comedy" },
      { id: "midsummer", title: "A Midsummer Night's Dream", kind: "Comedy" },
      { id: "tempest", title: "The Tempest", kind: "Romance" },
      { id: "henryiv", title: "Henry IV, Part 1", kind: "History" },
    ],
  },
  {
    id: "plato",
    name: "Plato",
    work: "the Dialogues",
    room: "The Academy",
    status: "planned",
    blurb: "Elenchus in the garden — the original case container: commit, be refuted, arrive at aporia.",
    skin: "Dialogue · the elenchus",
    works: [
      { id: "republic", title: "The Republic", kind: "Dialogue" },
      { id: "apology", title: "Apology", kind: "Dialogue" },
      { id: "symposium", title: "Symposium", kind: "Dialogue" },
      { id: "phaedo", title: "Phaedo", kind: "Dialogue" },
      { id: "meno", title: "Meno", kind: "Dialogue" },
      { id: "gorgias", title: "Gorgias", kind: "Dialogue" },
    ],
  },
  {
    id: "aristotle",
    name: "Aristotle",
    work: "the Nicomachean Ethics",
    room: "The Lyceum",
    status: "planned",
    blurb: "A walking argument toward the mean, testing your judgment case by case.",
    skin: "Deliberation · toward the mean",
    works: [
      { id: "ethics", title: "Nicomachean Ethics", kind: "Treatise" },
      { id: "poetics", title: "Poetics", kind: "Treatise" },
      { id: "politics", title: "Politics", kind: "Treatise" },
      { id: "rhetoric", title: "Rhetoric", kind: "Treatise" },
      { id: "metaphysics", title: "Metaphysics", kind: "Treatise" },
    ],
  },
];

export const LIVE_TUTOR = TUTORS.find((t) => t.status === "live")!;
