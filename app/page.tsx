import Link from "next/link";
import { Header } from "@/components/Panels";
import { WelcomeAudio } from "@/components/WelcomeAudio";
import { FacultyBrowser } from "@/components/FacultyBrowser";

const doors = [
  {
    href: "/rehearsal",
    no: "01",
    label: "The Rehearsal Room",
    tag: "Mode 1 · Shakespeare",
    kind: "Open inquiry",
    blurb:
      "Work a scene with Shakespeare. He answers from the text, presses you with one move at a time, and refuses — on purpose — where the play refuses.",
  },
  {
    href: "/encounter/Hamlet",
    no: "02",
    label: "Encounters",
    tag: "Mode 2 · His characters",
    kind: "Interrogation",
    blurb:
      "Question Hamlet, Gertrude, or Claudius — one way to play each. They know only what the text lets them know, and answer only what it licenses. Shakespeare stays in the room.",
  },
  {
    href: "/case",
    no: "03",
    label: "The Case",
    tag: "Mode 3 · The engine",
    kind: "Sustained argument · a verdict on you",
    blurb:
      "The Crown v. Hamlet: argue the killing of Polonius against the page. Commit to a position, meet resistance, rest your case — and be judged on the argument you built, and the evidence you ignored.",
  },
  {
    href: "/colloquy",
    no: "04",
    label: "Colloquy",
    tag: "Mode 4 · The author",
    kind: "Open conversation",
    blurb:
      "Sit with Shakespeare and ask him anything: life, love, death, ambition. He answers through what he staged, and hands every great question back to you sharpened.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-12 sm:px-8">
        {/* Hero — platform level */}
        <div className="animate-worklight-in">
          <h1 className="display max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight text-work-light sm:text-7xl">
            Socratic AI Tutors
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stage-dim">
            Every tutor is helping you grapple with their own texts by testing assumptions and
            building critical thinking skills.
          </p>
        </div>

        {/* The faculty — tutor first, then work. Built to scale past three. */}
        <div className="mt-12">
          <p className="worklabel mb-2">The faculty</p>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stage-dim">
            Pick the mind, then the work. Every tutor runs on the same engine: a persona met at
            work, their text on screen, and questioning in place of answers. One work is live in
            this demo.
          </p>
          <FacultyBrowser />
        </div>

        {/* Today's tutor — Shakespeare */}
        <div id="rooms" className="mt-14 scroll-mt-16">
          <p className="worklabel mb-1">Today&apos;s tutor</p>
          <h2 className="display text-3xl font-medium text-stage-ink">William Shakespeare · Hamlet</h2>
          <div className="mt-5">
            <WelcomeAudio />
          </div>
        </div>

        {/* Three modes */}
        <div className="mt-10">
          <p className="worklabel mb-2">Choose a room</p>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stage-dim">
            Four ways in. <span className="text-stage-ink">Rehearsal</span> is open inquiry,{" "}
            <span className="text-stage-ink">Encounter</span> is interrogation,{" "}
            <span className="text-stage-ink">Case</span> is a sustained argument with stakes and a
            verdict on you, and <span className="text-stage-ink">Colloquy</span> is the author
            himself, on any question you carry.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group flex flex-col rounded-xl border border-stage-edge bg-stage-panel/60 p-6 transition-all hover:-translate-y-0.5 hover:border-work-deep hover:bg-stage-panel"
              >
                <div className="flex items-center justify-between">
                  <span className="worklabel text-work-glow">{d.tag}</span>
                  <span className="display text-lg text-stage-faint">{d.no}</span>
                </div>
                <span className="display mt-3 text-2xl font-medium leading-tight text-stage-ink">
                  {d.label}
                </span>
                <span className="mt-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-work-glow">
                  {d.kind}
                </span>
                <span className="mt-3 flex-1 text-[13px] leading-relaxed text-stage-dim">{d.blurb}</span>
                <span className="mt-5 text-sm font-semibold text-work-glow transition-transform group-hover:translate-x-0.5">
                  Enter →
                </span>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
