# Pre-rendered audio (§7.4)

`VOICE_LIVE=off`. Drop the designed-voice renders here as static files:

- `welcome.mp3` — the Director's welcome monologue (conversational)
- `two-ways.mp3` — one line, two stagings (performance register)
- `refusal.mp3` — a refusal delivered aloud (refusal cadence)

Transcripts and intended registers are the source of truth in `lib/audio.ts`
(`AUDIO_MOMENTS`). See `scripts/design-voice.md` for the render runbook. The UI
degrades to the transcript if a file is missing.
