"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "./Panels";
import BookPane from "./BookPane";
import { MessageBody } from "./MessageBody";
import { useDialogue, TurnMeta } from "./useDialogue";
import { chipsFor } from "@/lib/chips";
import { loadSkin, nextPhase, tracker, PhaseDef } from "@/lib/engine/caseContainer";
import type { Mode, Skin } from "@/lib/types";

interface RoomProps {
  mode: Mode;
  headerSubtitle?: string;
  opening?: string;
  character?: string;
  skin?: Skin;
  // Encounter title card (§4.3)
  titleCard?: { title: string; note: string };
  frameBanner?: string;
}

export default function Room({
  mode,
  headerSubtitle,
  opening,
  character,
  skin,
  titleCard,
  frameBanner,
}: RoomProps) {
  const { messages, send, reset, streaming, lastMeta } = useDialogue(opening);
  const [input, setInput] = useState("");
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);

  // ── case machinery ─────────────────────────────────────────────
  const skinDef = useMemo(() => (mode === "case" ? loadSkin(skin ?? "trial") : null), [mode, skin]);
  const [phaseId, setPhaseId] = useState<string>(() => skinDef?.phases[0].id ?? "");
  const [challengeDone, setChallengeDone] = useState(0);
  const [side, setSide] = useState<string>("");
  const [theory, setTheory] = useState<string>("");
  const currentPhase: PhaseDef | undefined = skinDef?.phases.find((p) => p.id === phaseId);
  const positionReady = mode !== "case" || currentPhase?.kind !== "POSITION" || (side && theory);

  const lastWasRefusal = Boolean(lastMeta?.refusal);
  const chips = chipsFor({
    mode,
    turnCount,
    lastWasRefusal,
    character,
    phaseKind: currentPhase?.kind,
    activeRef,
  });

  const onMeta = (m: TurnMeta) => {
    if (m.citations?.length) setActiveRef(m.citations[0]);
  };

  // No fixed copy: the opening turn is generated live like any other. The
  // static `opening` prop remains only as an override for tests.
  const openedRef = useRef(false);
  useEffect(() => {
    if (opening || openedRef.current) return;
    openedRef.current = true;
    send("__OPENING__", { mode, skin, phase: phaseId, character }, onMeta, { hideUser: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSend = async (text: string) => {
    if (!text.trim() || streaming) return;
    let payloadInput = text;
    if (mode === "case" && currentPhase?.kind === "POSITION" && side && theory) {
      payloadInput = `[Acting for the ${side}. Theory: ${theory}.] ${text}`;
    }
    setInput("");
    setTurnCount((n) => n + 1);
    await send(payloadInput, { mode, skin, phase: phaseId, character }, onMeta);
  };

  const advance = async () => {
    if (!skinDef || !currentPhase || streaming) return;
    if (currentPhase.kind === "CLOSING") {
      // "Begin a new case"
      const firstId = skinDef.phases[0].id;
      setPhaseId(firstId);
      setChallengeDone(0);
      setSide("");
      setTheory("");
      setTurnCount(0);
      reset();
      await send("__OPENING__", { mode, skin, phase: firstId, character }, onMeta, { hideUser: true });
      return;
    }
    const label = currentPhase.advanceLabel;
    const { phase: np } = nextPhase(skinDef, phaseId, challengeDone);
    const stayingInChallenge = np.id === phaseId && np.kind === "CHALLENGE";
    const nextId = stayingInChallenge ? phaseId : np.id;
    if (stayingInChallenge) setChallengeDone((n) => n + 1);
    setPhaseId(nextId);
    setTurnCount((n) => n + 1);
    await send(label, { mode, skin, phase: nextId, character }, onMeta);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        subtitle={headerSubtitle}
        workLabel={mode === "colloquy" ? "All works" : undefined}
      />

      {frameBanner && (
        <div className="flex items-center justify-between border-b border-work-deep/30 bg-work-light/12 px-4 py-1.5 text-[12px] text-work-glow">
          <span>{frameBanner}</span>
          <span className="worklabel text-work-glow/80">Shakespeare is present · STOP SCENE to break</span>
        </div>
      )}

      <div className={`grid min-h-0 flex-1 grid-cols-1 ${mode === "colloquy" ? "" : "md:grid-cols-2"}`}>
        {/* LEFT — dialogue (full width in colloquy: no book open beside him) */}
        <div
          className={`flex min-h-0 flex-col ${
            mode === "colloquy" ? "mx-auto w-full max-w-3xl" : "border-r border-stage-edge"
          }`}
        >
          {titleCard && (
            <div className="border-b border-stage-edge bg-stage-panel/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="worklabel text-work-glow">A staging</div>
                {mode === "encounter" && (
                  <nav className="flex flex-wrap justify-end gap-1.5" aria-label="Choose a character">
                    {["Hamlet", "Gertrude", "Claudius", "Ophelia", "Ghost", "Horatio", "Laertes", "Scholar"].map((c) => (
                      <Link
                        key={c}
                        href={`/encounter/${c}`}
                        className={`rounded-full px-2.5 py-0.5 text-[12px] transition-colors ${
                          c === character
                            ? "bg-work-light/25 font-semibold text-work-glow"
                            : "border border-stage-edge text-stage-dim hover:border-work-deep hover:text-stage-ink"
                        }`}
                      >
                        {c}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
              <div className="display mt-0.5 text-lg font-medium text-stage-ink">{titleCard.title}</div>
              <div className="mt-0.5 text-[12px] text-stage-dim">{titleCard.note}</div>
            </div>
          )}

          {/* Case phase tracker + instruction (§5.1) */}
          {skinDef && currentPhase && (
            <div className="border-b border-stage-edge bg-stage-panel/60 px-4 py-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tracker(skinDef, phaseId).map((t, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em] ${
                      t.active
                        ? "bg-work-light/20 font-semibold text-work-glow"
                        : t.done
                          ? "text-stage-faint line-through"
                          : "text-stage-faint"
                    }`}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
              <p className="text-[12px] text-stage-dim">{currentPhase.instruction}</p>

              {currentPhase.kind === "POSITION" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="rounded border border-stage-edge bg-stage-deep px-2 py-1 text-[12px] text-stage-ink"
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                  >
                    <option value="">Choose a side…</option>
                    {skinDef.positionOptions?.map((o) => (
                      <option key={o.id} value={o.label}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border border-stage-edge bg-stage-deep px-2 py-1 text-[12px] text-stage-ink"
                    value={theory}
                    onChange={(e) => setTheory(e.target.value)}
                  >
                    <option value="">Choose a theory…</option>
                    {skinDef.theories?.map((o) => (
                      <option key={o.id} value={o.label}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm border border-stage-edge bg-stage-panel px-3.5 py-2 text-sm text-stage-ink"
                      : "max-w-[92%] text-[15px] leading-relaxed text-stage-ink"
                  }
                >
                  {m.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="display text-[15px] italic text-stage-ink">
                        {mode === "case" ? "The Judge" : character ? character : "Shakespeare"}
                      </span>
                      {m.meta?.refusal && (
                        <span className="rounded-full border border-work-deep/30 bg-work-light/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-work-glow">
                          designed silence
                        </span>
                      )}
                    </div>
                  )}
                  <MessageBody
                    text={m.content}
                    onCite={mode === "colloquy" ? undefined : setActiveRef}
                    plainCites={mode === "colloquy"}
                    emphasizeQuestion={m.role === "assistant" && !m.streaming}
                  />
                  {m.streaming && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
                </div>
              </div>
            ))}
            {!messages.length && (
              <p className="text-sm text-stage-faint">The stage is set. Say what scene we&apos;re working.</p>
            )}
          </div>

          {/* Chips (§4.4) */}
          <div className="flex flex-wrap gap-2 border-t border-stage-edge px-4 py-2.5">
            {mode === "encounter" && (
              <button className="prompt-chip border-accent-orange/60 text-accent-orange hover:border-accent-orange" onClick={() => doSend("STOP SCENE")}>
                STOP SCENE
              </button>
            )}
            {skinDef && currentPhase && (
              <button className="btn-work" onClick={advance} disabled={streaming || !positionReady}>
                {currentPhase.advanceLabel}
              </button>
            )}
            {chips.map((c) => (
              <button key={c} className="prompt-chip" onClick={() => doSend(c)} disabled={streaming || !positionReady}>
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            className="flex items-end gap-2 border-t border-stage-edge px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              doSend(input);
            }}
          >
            <textarea
              className="min-h-[44px] max-h-40 flex-1 resize-none rounded-md border border-stage-edge bg-stage-deep px-3 py-2 text-sm text-stage-ink placeholder:text-stage-faint focus:border-work-deep"
              placeholder={
                mode === "case" && currentPhase?.kind === "POSITION"
                  ? "Your opening statement (≤150 words)…"
                  : mode === "colloquy"
                    ? "Ask him anything…"
                    : "Speak to the page…"
              }
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  doSend(input);
                }
              }}
              disabled={streaming || !positionReady}
            />
            <button className="btn-work" type="submit" disabled={streaming || !input.trim() || !positionReady}>
              {streaming ? "…" : "Send"}
            </button>
          </form>
        </div>

        {/* RIGHT — the open book (all modes but Colloquy) */}
        {mode !== "colloquy" && (
          <div className="hidden min-h-0 md:block">
            <BookPane activeRef={activeRef} onAskAbout={(ref, text) => doSend(`What about this line — ${ref}? "${text}"`)} />
          </div>
        )}
      </div>
    </div>
  );
}
