import { notFound } from "next/navigation";
import { Header } from "@/components/Panels";
import { TutorHome } from "@/components/TutorHome";
import { TUTORS } from "@/lib/tutors";

export function generateStaticParams() {
  return TUTORS.map((t) => ({ id: t.id }));
}

export default function TutorPage({ params }: { params: { id: string } }) {
  const tutor = TUTORS.find((t) => t.id === params.id);
  if (!tutor) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header subtitle={tutor.room} />
      <TutorHome tutorId={tutor.id} />
    </div>
  );
}
