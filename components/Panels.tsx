"use client";

import { useState } from "react";
import Link from "next/link";
import { TUTORS, Tutor } from "@/lib/tutors";

// Tutor switcher — this demo runs one tutor, but the platform hosts many. The
// menu makes it clear you could move to another Socratic bot (Phase 2).
function TutorSwitcher({ currentName }: { currentName?: string }) {
  const [open, setOpen] = useState(false);
  const label = (currentName ?? TUTORS.find((t) => t.status === "live")!.name).split(" ").slice(-1)[0];
  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1.5 rounded-full border border-stage-edge bg-stage-panel px-3 py-1 text-[12px] text-stage-ink transition-colors hover:border-work-deep"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="worklabel text-work-glow">Tutor</span>
        <span className="font-medium">{label}</span>
        <span className="text-stage-faint">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 animate-worklight-in rounded-lg border border-stage-edge bg-stage-panel p-2 shadow-2xl">
            <p className="worklabel px-2 py-1.5 text-stage-faint">The faculty · one engine</p>
            {TUTORS.map((t) => {
              const live = t.status === "live";
              return (
                <Link key={t.id} href={`/tutor/${t.id}`} onClick={() => setOpen(false)}>
                  <div className="flex items-start justify-between gap-3 rounded-md px-2 py-2 hover:bg-work-light/10">
                    <div>
                      <div className="display text-[15px] text-stage-ink">{t.name}</div>
                      <div className="text-[12px] text-stage-dim">{t.blurb}</div>
                    </div>
                    {live && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-accent-yellow px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-stage-ink">
                        Live
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Works switcher — scoped to the CURRENT tutor. "All" is the tutor's own page
// (no work on the table, Colloquy open); each live work links to its dedicated
// page; the rest of the catalog shows dimmed.
function WorkSwitcher({ tutor, current }: { tutor: Tutor; current?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1.5 rounded-full border border-stage-edge bg-stage-panel px-3 py-1 text-[12px] text-stage-ink transition-colors hover:border-work-deep"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="worklabel text-work-glow">Work</span>
        <span className="font-medium">{current ?? "All"}</span>
        <span className="text-stage-faint">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-72 animate-worklight-in overflow-y-auto rounded-lg border border-stage-edge bg-stage-panel p-2 shadow-2xl">
            <p className="display px-2 py-1.5 text-[13px] italic text-stage-faint">
              {tutor.name}&apos;s works
            </p>
            <Link
              href={`/tutor/${tutor.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-work-light/10"
            >
              <span className="text-[14px] font-medium text-stage-ink">All</span>
              <span className="text-[11px] text-stage-faint">the tutor&apos;s page</span>
            </Link>
            {tutor.works.map((w) =>
              w.live ? (
                <Link
                  key={w.id}
                  href={`/tutor/${tutor.id}/${w.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-work-light/10"
                >
                  <span className="text-[14px] font-medium text-stage-ink">{w.title}</span>
                  <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-stage-ink">
                    Live
                  </span>
                </Link>
              ) : (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 opacity-60"
                  title="Not in this demo"
                >
                  <span className="text-[14px] text-stage-dim">{w.title}</span>
                  <span className="text-[11px] text-stage-faint">{w.kind}</span>
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Header({
  subtitle,
  workLabel,
  tutorId,
}: {
  subtitle?: string;
  workLabel?: string;
  tutorId?: string;
}) {
  const tutor = TUTORS.find((t) => t.id === tutorId) ?? TUTORS.find((t) => t.status === "live")!;
  return (
    <header className="relative z-50 flex items-center justify-between border-b border-stage-edge bg-stage-deep/70 px-4 py-2.5 backdrop-blur">
      <div className="flex items-baseline gap-3">
        {/* The brand is the place: whichever tutor's room you are standing in. */}
        <Link href="/" className="display text-base font-medium tracking-tight text-stage-ink">
          {tutor.room}
        </Link>
        {subtitle && <span className="hidden text-[12px] uppercase tracking-[0.14em] text-stage-faint md:inline">{subtitle}</span>}
      </div>
      <nav className="flex items-center gap-2">
        <Link href="/manual" className="btn-ghost">
          Manual
        </Link>
        <TutorSwitcher currentName={tutor.name} />
        <WorkSwitcher tutor={tutor} current={workLabel} />
      </nav>
    </header>
  );
}
