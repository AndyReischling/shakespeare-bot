"use client";

import { useState } from "react";
import { TUTORS } from "@/lib/tutors";

// The faculty, built to scale: a compact tutor rail (holds dozens of tutors;
// scrolls horizontally) and one detail panel where you choose that tutor's
// work. Tutor first, then work — no work is pre-chosen for you.
export function FacultyBrowser() {
  const [tutorId, setTutorId] = useState(TUTORS[0].id);
  const tutor = TUTORS.find((t) => t.id === tutorId)!;
  const live = tutor.status === "live";

  return (
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
  );
}
