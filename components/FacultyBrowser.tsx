"use client";

import { useState } from "react";
import { TUTORS, Tutor, Work } from "@/lib/tutors";
import { ColloquyCard } from "./TutorHome";
import { WorkRooms } from "./WorkRooms";

// The tutor met on their own terms, before any work is chosen: who they are,
// what they're known for, and the one room that needs no text on the table.
function TutorBio({ tutor }: { tutor: Tutor }) {
  const live = tutor.status === "live";
  return (
    <div className="mt-14 animate-worklight-in">
      <p className="worklabel mb-1">The tutor</p>
      <h2 className="display text-4xl font-medium text-stage-ink">{tutor.name}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="worklabel mb-2 text-stage-faint">Who he is</p>
          <p className="text-[15px] leading-relaxed text-stage-dim">{tutor.bio}</p>
          <p className="worklabel mt-7 mb-2 text-stage-faint">Why he matters</p>
          <ul className="space-y-1.5">
            {tutor.knownFor.map((k) => (
              <li key={k} className="text-[14px] leading-relaxed text-stage-dim">
                <span className="mr-2 text-work-glow">·</span>
                {k}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-sm text-stage-faint">
            {live
              ? "To work a text with him, choose a work above. To simply talk, the Colloquy is open."
              : "This tutor is authored the same way as the live tutor and is not staged in this demo."}
          </p>
        </div>
        <ColloquyCard tutor={tutor} />
      </div>
    </div>
  );
}

// The faculty, built to scale: a compact tutor rail and one detail panel where
// you choose that tutor's work. With no work chosen you are on the tutor's own
// page (bio and Colloquy only); choosing a work opens the text-bound rooms.
export function FacultyBrowser({
  onSelectionChange,
}: {
  onSelectionChange?: (tutor: Tutor, work: Work | null) => void;
}) {
  const [tutorId, setTutorIdState] = useState(TUTORS[0].id);
  const [workId, setWorkIdState] = useState<string | null>(null);
  const tutor = TUTORS.find((t) => t.id === tutorId)!;
  const live = tutor.status === "live";
  const selectedWork: Work | null = tutor.works.find((w) => w.id === workId) ?? null;

  const setTutorId = (id: string) => {
    setTutorIdState(id);
    onSelectionChange?.(TUTORS.find((t) => t.id === id)!, null);
  };
  const setWorkId = (id: string | null) => {
    setWorkIdState(id);
    onSelectionChange?.(tutor, tutor.works.find((w) => w.id === id) ?? null);
  };

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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTutorId(t.id);
                  setWorkId(null);
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-work-light/25 font-semibold text-work-glow"
                    : "border border-stage-edge text-stage-dim hover:border-work-deep hover:text-stage-ink"
                }`}
              >
                {t.name}
                {t.status === "live" && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent-orange align-middle" aria-label="live" />
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
              {tutor.works.map((w) => {
                const isSelected = selectedWork?.id === w.id;
                return w.live ? (
                  <button
                    key={w.id}
                    // Don't let a mouse click leave the card focused (the focus
                    // ring made it look permanently "on"). Keyboard focus keeps
                    // its ring for accessibility.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const next = isSelected ? null : w.id;
                      setWorkId(next);
                      if (next) {
                        // Show that something happened: bring the opened rooms into view.
                        requestAnimationFrame(() => {
                          document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        });
                      }
                    }}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-work-light bg-work-light shadow-sm"
                        : "border-stage-edge bg-stage-panel hover:border-work-deep"
                    }`}
                  >
                    <div className={`display text-[15px] font-medium leading-tight ${isSelected ? "text-white" : "text-stage-ink"}`}>
                      {w.title}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[11px] ${isSelected ? "text-white/75" : "text-stage-faint"}`}>
                        {w.kind}
                      </span>
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
                  <div
                    key={w.id}
                    className="rounded-lg border border-stage-edge/70 p-3 opacity-60"
                    title="Not in this demo"
                  >
                    <div className="display text-[15px] leading-tight text-stage-dim">{w.title}</div>
                    <div className="mt-1 text-[11px] text-stage-faint">{w.kind}</div>
                  </div>
                );
              })}
            </div>
            {live && (
              <p className="mt-3 text-[12px] text-stage-faint">
                {selectedWork
                  ? `${selectedWork.title} is on the table. The rooms are open below.`
                  : "No work chosen yet. Only the Colloquy is open; choose a work to open the rest."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Below the rail: the tutor's own page, or the chosen work's rooms. */}
      {live && selectedWork ? (
        <WorkRooms tutorName={tutor.name} workTitle={selectedWork.title} />
      ) : (
        <TutorBio tutor={tutor} />
      )}
    </div>
  );
}
