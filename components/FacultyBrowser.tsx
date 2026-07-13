"use client";

import { useState } from "react";
import Link from "next/link";
import { TUTORS } from "@/lib/tutors";
import { WelcomeAudio } from "./WelcomeAudio";

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

// The faculty, built to scale: a compact tutor rail (holds dozens of tutors;
// scrolls horizontally) and one detail panel where you choose that tutor's
// work. Everything below the rail follows the selection: the live tutor shows
// their welcome and rooms; a tutor who isn't staged in this demo says so
// honestly instead of silently showing someone else's rooms.
export function FacultyBrowser() {
  const [tutorId, setTutorId] = useState(TUTORS[0].id);
  const tutor = TUTORS.find((t) => t.id === tutorId)!;
  const live = tutor.status === "live";

  return (
    <div>
      <div className="rounded-xl border border-stage-edge bg-stage-panel/50">
        {/* Tutor rail — scrolls horizontally as the faculty grows */}
        <div
          className="flex gap-1.5 overflow-x-auto border-b border-stage-edge px-3 py-2.5"
          role="tablist"
          aria-label="Choose a tutor"
        >
          {TUTORS.map((t) => {
            const active = t.id === tutorId;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTutorId(t.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-work-light/25 font-semibold text-work-glow"
                    : "border border-stage-edge text-stage-dim hover:border-work-deep hover:text-stage-ink"
                }`}
              >
                {t.name}
                {t.status === "live" && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-work-deep align-middle" aria-label="live" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected tutor */}
        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="worklabel text-stage-faint">{tutor.room}</p>
            <h3 className="display mt-1 text-3xl font-medium text-stage-ink">{tutor.name}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-stage-dim">{tutor.blurb}</p>
            {!live && (
              <p className="mt-3 text-[12px] text-stage-faint">
                Authored the same way as the live tutor; not in this demo.
              </p>
            )}
          </div>

          <div>
            <p className="worklabel mb-2 text-stage-faint">Choose a work</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {tutor.works.map((w) =>
                w.live ? (
                  <a
                    key={w.id}
                    href="#rooms"
                    className="group rounded-lg border border-work-deep bg-work-light/10 p-3 transition-colors hover:bg-work-light/20"
                  >
                    <div className="display text-[15px] font-medium leading-tight text-stage-ink group-hover:text-work-glow">
                      {w.title}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-stage-faint">{w.kind}</span>
                      <span className="rounded-full bg-work-light/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-work-glow">
                        Live
                      </span>
                    </div>
                  </a>
                ) : (
                  <div
                    key={w.id}
                    className="rounded-lg border border-stage-edge/70 p-3 opacity-60"
                    title="Not in this demo"
                  >
                    <div className="display text-[15px] leading-tight text-stage-dim">{w.title}</div>
                    <div className="mt-1 text-[11px] text-stage-faint">{w.kind}</div>
                  </div>
                ),
              )}
            </div>
            {live && (
              <p className="mt-3 text-[12px] text-stage-faint">
                One work is live in this demo. Choosing it takes you to the rooms below.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Below the rail, the page follows the selection. */}
      {live ? (
        <>
          <div id="rooms" className="mt-14 scroll-mt-16">
            <p className="worklabel mb-1">Today&apos;s tutor</p>
            <h2 className="display text-3xl font-medium text-stage-ink">
              {tutor.name} · {tutor.work}
            </h2>
            <div className="mt-5">
              <WelcomeAudio />
            </div>
          </div>

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
        </>
      ) : (
        <div id="rooms" className="mt-14 scroll-mt-16">
          <div className="rounded-xl border border-dashed border-stage-edge bg-stage-panel/30 px-8 py-12 text-center">
            <p className="worklabel text-stage-faint">{tutor.room}</p>
            <h2 className="display mt-2 text-3xl font-medium text-stage-ink">The room is dark tonight.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stage-dim">
              {tutor.name} is authored the same way as the live tutor: their own texts on screen,
              their own hand-built refusal map, their own rooms. This demo stages one mind, and
              tonight the stage belongs to Shakespeare.
            </p>
            <button
              className="btn-work mt-6"
              onClick={() => setTutorId(TUTORS.find((t) => t.status === "live")!.id)}
            >
              Return to the live tutor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
