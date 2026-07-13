import { notFound } from "next/navigation";
import { TutorPageShell } from "@/components/TutorPageShell";
import { TUTORS } from "@/lib/tutors";

export function generateStaticParams() {
  return TUTORS.map((t) => ({ id: t.id }));
}

export default function TutorPage({ params }: { params: { id: string } }) {
  const tutor = TUTORS.find((t) => t.id === params.id);
  if (!tutor) notFound();

  return <TutorPageShell tutorId={tutor.id} />;
}
