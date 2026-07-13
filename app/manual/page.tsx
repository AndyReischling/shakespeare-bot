import Link from "next/link";
import { Header } from "@/components/Panels";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="display text-2xl font-medium text-stage-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-stage-dim">{children}</div>
    </section>
  );
}

export default function ManualPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header subtitle="Manual" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
        <p className="worklabel mb-3">Instruction manual</p>
        <h1 className="display text-4xl font-medium leading-tight text-stage-ink">
          How to work with a Socratic tutor
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stage-dim">
          This is not a chatbot that answers. It is a tutor that questions. You bring a claim; it
          brings the text. Expect to be pressed, one question at a time, and expect some questions
          to be refused on purpose. The refusals are the curriculum.
        </p>

        <Section title="Choosing a tutor and a work">
          <p>
            Use the <strong className="text-stage-ink">Tutor</strong> and{" "}
            <strong className="text-stage-ink">Work</strong> menus in the top bar. Each tutor
            teaches their own texts by the same process: the work on screen, every claim cited to a
            line, and questioning in place of answers. In this demo one work is live:{" "}
            <strong className="text-stage-ink">Shakespeare teaching Hamlet</strong>. The rest of the
            catalog shows how the same engine extends: pick Plato and The Republic, or Aristotle and
            the Poetics, and you would get this same room with a different mind in it.
          </p>
        </Section>

        <Section title="The four rooms">
          <p>
            <strong className="text-stage-ink">Rehearsal</strong> is open inquiry. Bring a scene, a
            speech, a line, or a question. Shakespeare anchors you to the page and presses with one
            question per turn: a staging choice, a word choice, the meter, a counter-scene.
          </p>
          <p>
            <strong className="text-stage-ink">Encounters</strong> are interrogation. Each
            character introduces themselves first, in their own voice, and then you question them
            directly: Hamlet, Gertrude, Claudius, Ophelia, the Ghost, Horatio, Laertes. You may put
            any line of the play to them, from any scene. Lines from scenes they stood in, they
            answer from inside the memory. Lines from scenes they never saw, they react to as the
            character would on first hearing: recognition, denial, wonder, anger. They never claim
            to have witnessed what they did not, and the reaction is the performance. Ask a
            character to explain what the play leaves dark and they will perform the withholding
            rather than invent an answer. Use{" "}
            <strong className="text-stage-ink">STOP SCENE</strong> to break the frame and get the
            playwright back; ask &ldquo;how else could that line be played?&rdquo; and he steps
            forward with competing stagings.
          </p>
          <p>
            <strong className="text-stage-ink">The Case</strong> is a sustained argument with stakes
            and a verdict on you. The Crown against Hamlet, for the killing of Polonius. Pick a side
            and a theory, make an opening statement, examine witnesses, enter evidence, and rest.
            Questions that assume facts the text never establishes get an objection sustained, with
            the ruling explaining why. The closing judges the argument you built, including the
            strongest evidence you never used. No verdict is passed on the Prince. One is passed on
            you.
          </p>
          <p>
            <strong className="text-stage-ink">Colloquy</strong> is open conversation with the
            author himself, on any question you carry. It has its own section below.
          </p>
        </Section>

        <Section title="Colloquy: ask the author anything">
          <p>
            The other three rooms study the selected work. Colloquy is different in kind: you sit
            with the man, and the subject is whatever you bring. The meaning of life. Whether love
            lasts. How to face death. What ambition costs. Whether a person can change. Nothing is
            off the table, including things no one in 1600 could know, which he will meet honestly,
            as a man of his time, by mapping them to the human constants his work does know.
          </p>
          <p>
            Three things make it a Socratic conversation rather than an oracle. First, he answers
            only through what he staged: every turn draws on his work, quoted and cited from the
            whole canon, any play, any sonnet, not just the work selected in this demo. Second, he
            will not hand down verdicts on the great questions; his plays argue both sides, and he
            will show you where they disagree with each other. Third, every answer ends with one
            pointed question aimed back at you and your own case. You leave with less certainty and
            better questions. That is the point.
          </p>
          <p>
            It is also the one room without the book open beside you, because the conversation is
            not anchored to a single text. References appear inline as he cites them.
          </p>
        </Section>

        <Section title="The book is the other half of the screen">
          <p>
            In Rehearsal, Encounters, and the Case, the full text of the play sits beside the
            dialogue, so both of you are looking at the same page. It works in both directions:
          </p>
          <p>
            When the tutor cites a line, the reference appears as a small chip like{" "}
            <span className="cite-chip">3.4.31</span>. Click it and the book turns to that scene and
            lights the line. When <em>you</em> find a line you want to work, click it in the book
            and choose &ldquo;What about this line?&rdquo; to send it into the conversation. Page
            through scene by scene with the Prev and Next controls, or jump anywhere with the scene
            menu.
          </p>
        </Section>

        <Section title="The designed silences">
          <p>
            Some questions the play raises and deliberately drops: why Hamlet delays, what Gertrude
            knew, whether the Ghost is honest, whether the madness is feigned. On these the tutor
            will not manufacture an answer, because there is none in the text. Instead it shows you
            where the play opens the question, and what named critics have argued on each side, and
            it hands the case to you. If you push three times, it will tell you plainly: the door is
            shut, and the essay worth writing is about why.
          </p>
        </Section>

        <Section title="What it will not do">
          <p>
            It will not summarize the play, translate speeches into modern English, or write your
            essay. Ask, and it declines in character and turns the request back into a question.
            That is the academic-integrity design, not a missing feature: the tutor exists to make
            you build the argument, not to build it for you.
          </p>
        </Section>

        <Section title="Suggestions, if you stall">
          <p>
            The small prompts under the input box are always safe moves: they rotate with where you
            are, and in an Encounter they are tuned to the character in front of you. Free typing
            always works too. There is no wrong door in this building.
          </p>
        </Section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/rehearsal" className="btn-work">
            Enter the Rehearsal Room
          </Link>
          <Link href="/colloquy" className="btn-ghost">
            Sit for a Colloquy
          </Link>
          <Link href="/" className="btn-ghost">
            Back to the front door
          </Link>
        </div>
      </main>
    </div>
  );
}
