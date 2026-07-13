import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Panels";
import { WorkRooms } from "@/components/WorkRooms";
import { TUTORS } from "@/lib/tutors";

export function generateStaticParams() {
  return TUTORS.flatMap((t) =>
    t.works.filter((w) => w.live).map((w) => ({ id: t.id, work: w.id })),
  );
}

// The work-specific page: this tutor, this text on the table, the rooms open.
export default function WorkPage({ params }: { params: { id: string; work: string } }) {
  const tutor = TUTORS.find((t) => t.id === params.id);
  const work = tutor?.works.find((w) => w.id === params.work);
  if (!tutor || !work || !work.live) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header subtitle={tutor.room} tutorId={tutor.id} workLabel={work.title} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 sm:px-8">
        <WorkRooms tutorName={tutor.name} workTitle={work.title} />
        <p className="mt-10 text-sm text-stage-faint">
          Looking for the tutor himself?{" "}
          <Link href={`/tutor/${tutor.id}`} className="font-medium text-work-glow hover:underline">
            {tutor.name}&apos;s page
          </Link>{" "}
          has his life, his catalog, and the Colloquy.
        </p>
      </main>
    </div>
  );
}
