"use client";

import { useState } from "react";
import { Header } from "./Panels";
import { FacultyBrowser } from "./FacultyBrowser";
import { TUTORS, Tutor, Work } from "@/lib/tutors";

// Client shell for the landing page so the header's Tutor/Work switchers follow
// the faculty-rail selection instead of sitting on a hard-coded default.
export function LandingPage() {
  const [tutor, setTutor] = useState<Tutor>(TUTORS[0]);
  const [work, setWork] = useState<Work | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header tutorLabel={tutor.name} workLabel={work?.title ?? "—"} />
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

        {/* The faculty — tutor first, then work. Everything below follows the selection. */}
        <div className="mt-12">
          <p className="worklabel mb-2">The faculty</p>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stage-dim">
            Pick the mind, then the work. Every tutor runs on the same engine: a persona met at
            work, their text on screen, and questioning in place of answers. One work is live in
            this demo.
          </p>
          <FacultyBrowser
            onSelectionChange={(t, w) => {
              setTutor(t);
              setWork(w);
            }}
          />
        </div>
      </main>
    </div>
  );
}
