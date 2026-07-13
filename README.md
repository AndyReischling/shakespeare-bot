# The Rehearsal Room

**One Shakespeare. One voice. Three modes on one engine.** An unattended Socratic
literature prototype built around *Hamlet* — and around the moments a play must
**not** answer.

> The system is designed for the moments it must not answer. Every mode forces the
> user to commit to a position that can be examined against the page both parties
> are looking at.

This runs unattended: evaluators use it alone, with nobody narrating. So it
self-explains, and it never dead-ends — every screen has an obvious next move.
**Every turn is generated live; there are no scripted responses.** If the model
cannot answer, the user sees an honest error state and retries.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then set ANTHROPIC_API_KEY (required)
npm run dev                    # http://localhost:3000
```

`ANTHROPIC_API_KEY` (model `claude-sonnet-4-6`) is required — the dialogue engine
is the product. Optionally set `EMBEDDING_PROVIDER=openai|voyage` (+ key) to swap
the file-based vector store in for the local lexical retrieval scorer.

```bash
npm run build:refusal   # validate the refusal map schema (15–25 patterns, named critics…)
npm run build:index     # build the file-based vector store (dual-index)
npm run typecheck
npm run build
```

---

## The three modes, one persona

The avatar is **Shakespeare as a working director** — a Warwickshire craftsman
running a commercial playhouse, not the biographical sage. One persona
(`lib/prompts/persona.ts`), three functions:

1. **Rehearsal Room** (`/rehearsal`) — you talk to the Director. Anchor → one
   Socratic press per turn → named-critic sparring → never a settled reading.
2. **Encounters** (`/encounter/[character]`) — you talk to *his characters*
   (Hamlet, Gertrude, Claudius). Knowledge boundary, diction boundary, and the
   silence rule are enforced; on a framing question he steps forward (frame-break).
3. **The Case** (`/case`) — *The Crown v. Hamlet*, the killing of Polonius, run on
   a skin-agnostic pedagogical state machine.

## The architecture argument: the Case Container

`lib/engine/caseContainer.ts` is a skin-agnostic phase machine
(`POSITION → CHALLENGE_ROUNDS(n) → EVIDENCE → CLOSING`) with four invariants:
**Position** (commit up front), **Resistance** (pushes back within textual
limits), **Diegetic discipline** (evidence rules enforced by the fiction — rulings
and objections, not error messages), and **Whole-argument closing** (assesses what
you built, *including what you didn't use*).

Genres choose their native skin:

- `skins/trial.hamlet.json` — **built** (tragedy → trial).
- `skins/persuasion.twelfthnight.json` — **schema-only stub** (comedy → persuasion).
- `skins/pitch.universal.json` — **schema-only stub** (any play → production pitch).

*The container persists; the genre chooses its native form.* This is the scaling
answer for the rest of the corpus and the structural bridge to the
Plato/Aristotle avatars (a Socratic dialogue is itself a case container).

## The differentiating artifact: the refusal map

`data/refusal-map.json` — hand-authored designed silences (the delay, Gertrude's
knowledge, the Ghost's nature, madness, Hamlet's age, pre-play Ophelia, the
sullied/solid crux, Hamlet's love for Ophelia). Each entry: 15–25 paraphrase
patterns, a textual surface, ≥2 **named** critical positions with the dissent, and
Socratic moves.

**Matcher** (`lib/refusal.ts`): embed input → similarity vs. patterns → hit ≥ 0.75
fires; the ambiguous band 0.55–0.75 triggers one cheap LLM classification (with a
key-free widening fallback). Paraphrase misses are the #1 unattended failure mode,
so the classifier fallback is not optional.

On a hit, the **Silence Protocol** (`lib/prompts/silence.ts`, all modes): name the
silence → jump the book → open the named dispute (no winner) → one Socratic move →
never resolve (on the third push: four centuries have pushed here; the
essay-worthy question is *why the door is shut*).

## The shared book (UX thesis)

Two panes: dialogue left, the open book right — **always the same page both parties
are looking at**. Citation chips jump the book; highlighting a line sends it back
into dialogue (bidirectional, `components/BookPane.tsx`).

## Corpus & data layer (`/data`)

File-based, no infra. `hamlet.json` — the **full text of Hamlet** (4,090 entries
across all 20 scenes), ingested from Project Gutenberg #1524 via
`npm run ingest:play`, with per-scene `onstage` tracking that powers the encounter
knowledge boundary. A slim `hamlet.book.json` (no `onstage`/`notes_ref`) ships to
the book pane so the browser doesn't download the knowledge graph. Tier 1 embedded
criticism
(`criticism/tier1.json`), Variorum for 1.2/3.1/3.4, and a Tier 2 **pointer-only**
index of copyrighted modern criticism (`modern-criticism-index.json`) — the avatar
points ("RGBC's library has Greenblatt…"), never quotes.

`lib/textLicense.ts` verifies every Encounter/Case turn: quoted strings are
fuzzy-matched against the text; anything < 0.92 similarity is stripped and
regenerated once, falling back to citation-by-reference. In Case mode the same
layer surfaces diegetically as the objection/ruling mechanics — one
implementation, two costumes.

## Voice (`lib/audio.ts`, `scripts/design-voice.md`)

A fully **synthetic** working voice (ElevenLabs Voice Design) ⇒ no third-party
likeness/rights chain (the RFP asks vendors to confirm no rights conflicts). Two
registers, one voice, register as delivery direction (`lib/prompts/delivery.ts`).
`VOICE_LIVE=off`: 3–5 pre-rendered authored moments in `/public/audio`; the UI
degrades to transcripts.

---

## Out of scope — sequenced, not missing (§10)

Each of the following is a deliberate Phase-2 item, not an omission. *Rendering is
an amplifier; we don't amplify until the thing being amplified is right.*

- Photoreal rendering / MetaHuman
- Live per-turn TTS
- Original Pronunciation **performance** (reconstructed phonology; the pedagogy is
  kept in text — the Director tells you "prove and love rhymed in my mouth")
- Multi-play corpus
- Accounts / durable persistence (today: `lib/sessionStore.ts`, swappable)
- FERPA posture
- Assessment-rubric authoring
- Tier-3 licensed criticism (a Phase-2 procurement question)
- Persuasion / pitch **skin content** (schemas are authored and valid)

## Ops

Vercel, password-gated link (`ACCESS_PASSWORD`), per-IP rate limit + global daily
API cap (`lib/ops.ts`), anonymous session logging with an in-product notice
(`lib/log.ts`). Freeze deploys during the evaluation window.

## Layout

```
/app        pages (mode select, rehearsal, encounter, case) + /api/dialogue (SSE)
/components  two-pane UI (Room, BookPane, MessageBody, panels, chips)
/lib         persona + per-mode prompts (the IP), engine + skins, retrieval,
             refusal, textLicense, meter, sessionStore, embeddings, audio, ops
/data        hamlet.json, criticism, variorum, refusal-map, pointer index
/scripts     ingest + index builders, refusal-map validator, voice runbook
/public/audio pre-rendered authored moments
```
