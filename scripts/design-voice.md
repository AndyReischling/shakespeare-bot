# Voice Design Runbook (§7.2)

One-time production of the single designed voice. The voice is a **working
voice**: a Warwickshire glover's son running a commercial playhouse — warm,
rhotic, working-class-intelligent. **Not** plummy RP, **not** a stage actor's
declamation (RP is an 18th–19th-c. invention; "posh Shakespeare" is the
anachronism, §7.1).

Fully synthetic ⇒ no third-party likeness/rights chain. Note this in the README;
the RFP asks vendors to confirm no rights conflicts.

## Tool

**ElevenLabs Voice Design (v3, Realistic mode).** Generates three candidates per
run from a text description.

## Procedure

1. **Iterate 5–10 runs** from the design prompt below. Prefer **longer prompts at
   lower guidance scale**.
2. **Judge on the _conversational_ preview.** The everyday register is ~90% of the
   product; do not pick a voice on a declaimed line.
3. **Dial in with Voice Remixing** — nudge "less RP, more Midlands" until the
   accent sits.
4. **Pin the seed.** Record it in `.env.local` alongside `ELEVENLABS_VOICE_ID`.
5. **Save the voice.**

### Design prompt (verbatim starting point)

> Male, early 50s, English Midlands accent — warm, rhotic, working-class
> intelligent, distinctly not posh RP and not a stage actor's declamation. A
> theater director in his own rehearsal room: quick, dry, conversational pacing
> with natural pauses to think. Vocal texture slightly weathered, like a man who
> has spent twenty years talking over carpenters and musicians. Playful
> intelligence, a craftsman's confidence, speaks in prose not performance.
> Recording quality: close, natural, roomy — a working space, not a studio booth.

## Delivery direction (§7.3)

Register is a prompting artifact over the ONE voice — see `lib/prompts/delivery.ts`.

- **Conversational** (default): natural, dry, unforced.
- **Performance** (any quoted line): measured pace, weight, a beat of silence
  before and after. The audible gearshift marks the quotation boundary by ear.
- **Refusal cadence**: a genuine pause _before_ a Silence Protocol response.
- **Judge cadence**: slower, formal, faintly amused.

## Pre-render for the demo (§7.4) — `VOICE_LIVE=off`

Render 3–5 authored moments to `/public/audio` with the saved voice. Source
transcripts + intended register live in `lib/audio.ts` (`AUDIO_MOMENTS`):

| id         | file                     | register       | what it proves                          |
| ---------- | ------------------------ | -------------- | --------------------------------------- |
| welcome    | `public/audio/welcome.mp3`   | conversational | best first impression / RFP 2-min demo |
| two-ways   | `public/audio/two-ways.mp3`  | performance    | same line, two stagings (gearshift)     |
| refusal    | `public/audio/refusal.mp3`   | refusal        | a refusal delivered aloud, not evasive  |

Static files, zero runtime risk. The UI (`components/WelcomeAudio.tsx`) degrades
to the transcript if a file is absent.

## Cut from the demo (named Phase 2)

Live Original Pronunciation performance (reconstructed phonology — TTS can't do
it credibly). Keep the pedagogy in text: the Director _tells_ you "prove and love
rhymed in my mouth; your century broke it," and the book shows the lost rhyme. OP
performance = a named Phase 2 actor-recording item.
