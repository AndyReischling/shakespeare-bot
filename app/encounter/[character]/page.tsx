import Room from "@/components/Room";
import { notFound } from "next/navigation";

const CHARACTERS: Record<string, { article: string; note: string; pronoun: string }> = {
  Hamlet: {
    article: "A Hamlet",
    note: "One way to play him: the student prince, quick and grieving. Question the performance.",
    pronoun: "His",
  },
  Gertrude: {
    article: "A Gertrude",
    note: "One way to play her: the Queen, who was not shown everything. Question the performance.",
    pronoun: "Her",
  },
  Claudius: {
    article: "A Claudius",
    note: "One way to play him: the smiling politician, after his prayers (3.3). Question the performance.",
    pronoun: "His",
  },
  Ophelia: {
    article: "An Ophelia",
    note: "One way to play her: obedient, watched, and telling the truth slant. Question the performance.",
    pronoun: "Her",
  },
  Ghost: {
    article: "A Ghost",
    note: "One way to play it: the thing on the battlements that cries revenge. Question the performance.",
    pronoun: "Its",
  },
  Horatio: {
    article: "A Horatio",
    note: "One way to play him: the scholar who watches everything and survives it. Question the performance.",
    pronoun: "His",
  },
  Laertes: {
    article: "A Laertes",
    note: "One way to play him: the other revenging son, who does not delay. Question the performance.",
    pronoun: "His",
  },
};

export default function EncounterPage({ params }: { params: { character: string } }) {
  const key = decodeURIComponent(params.character);
  const meta = CHARACTERS[key];
  if (!meta) notFound();

  return (
    <Room
      mode="encounter"
      character={key}
      headerSubtitle={`Encounter · ${key}`}
      titleCard={{ title: meta.article, note: meta.note }}
      frameBanner={`You are speaking to ${key === "Ghost" ? "the Ghost" : key}. ${meta.pronoun} lines, staged.`}
    />
  );
}
