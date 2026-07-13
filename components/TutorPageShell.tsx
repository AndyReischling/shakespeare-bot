"use client";

import { useState } from "react";
import { Header } from "./Panels";
import { TutorHome } from "./TutorHome";
import { TUTORS, Work } from "@/lib/tutors";

// Client shell for a tutor's page: keeps the header's Tutor/Work switchers in
// step with where the reader actually is (this tutor; no work until chosen).
export function TutorPageShell({ tutorId }: { tutorId: string }) {
  const tutor = TUTORS.find((t) => t.id === tutorId)!;
  const [work, setWork] = useState<Work | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header subtitle={tutor.room} tutorLabel={tutor.name} workLabel={work?.title ?? "—"} />
      <TutorHome tutorId={tutor.id} onWorkChange={setWork} />
    </div>
  );
}
