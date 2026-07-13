"use client";

import { useState } from "react";
import Link from "next/link";
import { TUTORS, Tutor, Work } from "@/lib/tutors";

// A tutor's homepage. No work is pre-chosen. Colloquy is always open, because a
// conversation with the author needs no text on the table. The other three
// rooms are work-bound: they unlock when a work is chosen.

const WORK_ROOMS = [
  {
    href: "/rehearsal",
    label: "The Rehearsal Room",
    kind: "Open inquiry",
    blurb: "Work the text with the author, one question at a time, every claim shown on the page.",
  },
  {
    href: "/encounter/Hamlet",
    label: "Encounters",
    kind: "Interrogation",
    blurb: "Question the characters. They know only what the text lets them witness.",
  },
  {
    href: "/case",
    label: "The Case",
    kind: "Sustained argument",
    blurb: "Commit to a position, meet resistance, rest your case, and receive a verdict on the argument you built.",
  },
];

export function ColloquyCard({ tutor }: { tutor: Tutor }) {
  const live = tutor.status === "live";
  const firstName = tutor.name.split(" ").slice(-1)[0];
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="worklabel text-work-glow">Always open · no work required</span>
        {live && (
          <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-stage-ink">
            Live
          </span>
        )}
      </div>
      <span className="display mt-2 text-2xl font-medium text-stage-ink">Colloquy</span>
      <span className="mt-2 text-[14px] leading-relaxed text-stage-dim">
        Sit with {firstName} and ask anything: life, love, death, ambition. He answers from
        everything he wrote and hands every great question back to you sharpened.
      </span>
      <span className="mt-4 text-sm font-semibold text-work-glow">
        {live ? "Enter the Colloquy →" : "Not in this demo"}
      </span>
    </>
  );

  return live ? (
    <Link
      href="/colloquy"
      className="flex flex-col rounded-xl border border-work-deep bg-work-light/10 p-6 transition-colors hover:bg-work-light/20"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex flex-col rounded-xl border border-stage-edge bg-stage-panel/40 p-6 opacity-70">
      {inner}
    </div>
  );
}

export function TutorHome({ tutorId }: { tutorId: string }) {
  const tutor = TUTORS.find((t) => t.id === tutorId)!;
  const live = tutor.status === "live";
  const [selected, setSelected] = useState<Work | null>(null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8">
      {/* Hero: who the tutor is, before any work is chosen */}
      <div className="animate-worklight-in">
        <p className="worklabel mb-2">{tutor.room}</p>
        <h1 className="display text-4xl font-medium leading-tight text-stage-ink sm:text-6xl">
          {tutor.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-stage-dim">{tutor.bio}</p>
        <p className="worklabel mt-6 mb-2 text-stage-faint">Known for</p>
        <ul className="max-w-2xl space-y-1.5">
          {tutor.knownFor.map((k) => (
            <li key={k} className="text-[14px] leading-relaxed text-stage-dim">
              <span className="mr-2 text-work-glow">·</span>
              {k}
            </li>
          ))}
        </ul>
        {!live && (
          <p className="mt-4 max-w-2xl text-sm text-stage-faint">
            Authored the same way as the live tutor; not staged in this demo.
          </p>
        )}
      </div>

      {/* Colloquy: no work needed */}
      <div className="mt-10">
        <ColloquyCard tutor={tutor} />
      </div>

      {/* Works unlock the other rooms */}
      <div className="mt-12">
        <p className="worklabel mb-2">The other rooms need a text on the table</p>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stage-dim">
          Rehearsal, Encounters, and the Case all work against a specific text. Choose one of{" "}
          {tutor.name.split(" ").slice(-1)[0]}&apos;s works to open them.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {tutor.works.map((w) => {
            const isSelected = selected?.id === w.id;
            return w.live ? (
              <button
                key={w.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSelected(isSelected ? null : w)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-work-light bg-work-light shadow-sm"
                    : "border-stage-edge bg-stage-panel hover:border-work-deep"
                }`}
              >
                <div className={`display text-[15px] font-medium leading-tight ${isSelected ? "text-white" : "text-stage-ink"}`}>{w.title}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[11px] ${isSelected ? "text-white/75" : "text-stage-faint"}`}>{w.kind}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] ${
                      isSelected ? "bg-stage-ink text-white" : "bg-accent-yellow text-stage-ink"
                    }`}
                  >
                    {isSelected ? "Chosen ✓" : "Live"}
                  </span>
                </div>
              </button>
            ) : (
              <div key={w.id} className="rounded-lg border border-stage-edge/70 p-3 opacity-60" title="Not in this demo">
                <div className="display text-[15px] leading-tight text-stage-dim">{w.title}</div>
                <div className="mt-1 text-[11px] text-stage-faint">{w.kind}</div>
              </div>
            );
          })}
        </div>

        {/* The three work-bound rooms */}
        {selected ? (
          <div className="mt-8 animate-worklight-in">
            <p className="worklabel mb-3">
              {selected.title} is on the table · choose a room
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {WORK_ROOMS.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group flex flex-col rounded-xl border border-stage-edge bg-stage-panel/60 p-5 transition-all hover:-translate-y-0.5 hover:border-work-deep hover:bg-stage-panel"
                >
                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-work-glow">
                    {d.kind}
                  </span>
                  <span className="display mt-1 text-xl font-medium leading-tight text-stage-ink">
                    {d.label}
                  </span>
                  <span className="mt-2 flex-1 text-[13px] leading-relaxed text-stage-dim">{d.blurb}</span>
                  <span className="mt-4 text-sm font-semibold text-work-glow transition-transform group-hover:translate-x-0.5">
                    Enter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-stage-faint">
            {live
              ? "Choose a work above to open Rehearsal, Encounters, and the Case."
              : "No works are staged for this tutor in the demo. The Colloquy and the rooms open when the tutor does."}
          </p>
        )}
      </div>
    </main>
  );
}
