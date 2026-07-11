// audio.ts — pre-rendered authored moments (spec §7.4). VOICE_LIVE=off for the
// demo: static files in /public/audio, zero runtime risk. The UI degrades to
// text if a file is absent (an unattended demo never dead-ends on a missing asset).

export interface AudioMoment {
  id: string;
  label: string;
  register: "conversational" | "performance" | "refusal" | "judge";
  src: string; // path under /public
  transcript: string;
  note: string;
}

export const VOICE_LIVE = (process.env.VOICE_LIVE || "off").toLowerCase() === "on";

// The 3–5 authored moments. Render with the designed voice (see
// scripts/design-voice.md) and drop the mp3s into /public/audio.
export const AUDIO_MOMENTS: AudioMoment[] = [
  {
    id: "welcome",
    label: "The welcome monologue",
    register: "conversational",
    src: "/audio/welcome.mp3",
    transcript:
      "Welcome to my rehearsal room. Three rules, and then to work. First: I speak from the text. Make I a claim, I'll show thee the line it stands on. Second: some questions the play will not answer. Why Hamlet tarries. What the Queen knew. On these I'll not guess. I'll show thee where the play raises the matter and lets it fall, and what the scholars have quarrelled over these four hundred years. The case is thine to make. Third: I'll not summarize the play, nor write a word in thy stead. That part is thine. Now, what scene do we work?",
    note: "The best first impression the demo can make (§4.1). Doubles as the RFP finalist-stage 2-minute demonstration dialogue.",
  },
  {
    id: "two-ways",
    label: "One line, two stagings",
    register: "performance",
    src: "/audio/two-ways.mp3",
    transcript:
      "\"To be, or not to be: that is the question.\" — hear it once as a man deciding whether to live … and once as a man performing the thought for the watchers he knows are there. Same line, two stagings. Which does the surrounding text support?",
    note: "The audible gearshift into performance register marks the quotation boundary by ear (§7.3).",
  },
  {
    id: "refusal",
    label: "A refusal, delivered aloud",
    register: "refusal",
    src: "/audio/refusal.mp3",
    transcript:
      "Why does he delay. … Four centuries have leaned on that door. I won't pretend to open it for you. The play raises it — 'the time is out of joint' — and then keeps his reasons inside his own mouth, where you can't check them. Bradley says melancholy; Coleridge says too much thought; the stage tradition says there's no delay to explain at all. Pick your fight. Which of the three does 4.4 actually feed?",
    note: "A genuine pause before speaking — a director weighing the question, not a bot evading it (§7.3).",
  },
];

export function audioMoment(id: string): AudioMoment | undefined {
  return AUDIO_MOMENTS.find((m) => m.id === id);
}
