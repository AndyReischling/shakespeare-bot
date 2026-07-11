import { AUDIO_MOMENTS } from "@/lib/audio";

// Shakespeare's welcome, shown as text on the landing page. (The pre-rendered
// audio pipeline still exists in lib/audio.ts and scripts/design-voice.md; this
// block deliberately carries no player.)
export function WelcomeAudio() {
  const moment = AUDIO_MOMENTS.find((m) => m.id === "welcome")!;

  return (
    <div className="rounded-lg border border-stage-edge bg-stage-panel/50 p-4">
      <div className="worklabel text-work-glow">Shakespeare&apos;s welcome</div>
      <p className="display mt-2 text-lg italic leading-relaxed text-stage-dim">
        “{moment.transcript}”
      </p>
    </div>
  );
}
