"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import bookData from "@/data/hamlet.book.json";
import type { Line, SceneMeta } from "@/lib/types";

// Slim client dataset (no onstage/notes_ref) — see scripts/ingest-play.ts.
const hamlet = bookData as unknown as { scenes: SceneMeta[]; lines: Line[] };

interface BookPaneProps {
  activeRef?: string | null;
  onAskAbout?: (ref: string, text: string) => void;
}

export default function BookPane({ activeRef, onAskAbout }: BookPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [selected, setSelected] = useState<Line | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  // pages = scenes (turn the page = go to the next scene)
  const pages = useMemo(
    () =>
      hamlet.scenes.map((s) => ({
        meta: s,
        lines: hamlet.lines.filter((l) => `${l.act}.${l.scene}` === s.id),
      })),
    [],
  );

  const sceneIndexOfRef = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of hamlet.lines) {
      if (!l.ref) continue;
      const sid = `${l.act}.${l.scene}`;
      const idx = hamlet.scenes.findIndex((s) => s.id === sid);
      if (idx >= 0) m[l.ref] = idx;
    }
    return m;
  }, []);

  // A citation chip: turn to the page holding the line…
  useEffect(() => {
    if (!activeRef) return;
    const idx = sceneIndexOfRef[activeRef];
    if (idx != null && idx !== pageIndex) setPageIndex(idx);
  }, [activeRef, sceneIndexOfRef, pageIndex]);

  // …then scroll to and flash it once the page is showing.
  useEffect(() => {
    if (!activeRef) return;
    const el = lineRefs.current[activeRef];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(activeRef);
      const t = setTimeout(() => setFlash(null), 1500);
      return () => clearTimeout(t);
    }
  }, [activeRef, pageIndex]);

  const turn = (delta: number) => {
    setPageIndex((i) => Math.min(pages.length - 1, Math.max(0, i + delta)));
    setSelected(null);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const page = pages[pageIndex];
  let prevSpeaker = "";

  return (
    <div className="flex h-full flex-col bg-page-paper text-page-text">
      {/* Page-turning controls */}
      <div className="flex items-center justify-between gap-2 border-b border-page-line/70 px-3 py-2">
        <button
          className="rounded px-2 py-1 text-[13px] text-page-faint transition-colors hover:text-page-text disabled:opacity-30"
          onClick={() => turn(-1)}
          disabled={pageIndex === 0}
          aria-label="Previous scene"
        >
          ‹ Prev
        </button>
        <div className="flex items-center gap-2">
          <select
            className="max-w-[15rem] truncate rounded border border-page-line bg-page-paper px-2 py-1 text-[12px] text-page-text"
            value={pageIndex}
            onChange={(e) => {
              setPageIndex(Number(e.target.value));
              setSelected(null);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            aria-label="Jump to scene"
          >
            {pages.map((p, i) => (
              <option key={p.meta.id} value={i}>
                {p.meta.act}.{p.meta.scene} — {p.meta.title}
              </option>
            ))}
          </select>
          <span className="hidden text-[11px] text-page-faint sm:inline">
            {pageIndex + 1}/{pages.length}
          </span>
        </div>
        <button
          className="rounded px-2 py-1 text-[13px] text-page-faint transition-colors hover:text-page-text disabled:opacity-30"
          onClick={() => turn(1)}
          disabled={pageIndex === pages.length - 1}
          aria-label="Next scene"
        >
          Next ›
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 font-serif">
        <header className="px-4 pb-3">
          <div className="worklabel text-page-faint">The open book · Hamlet</div>
          <h3 className="display mt-1 text-2xl font-medium text-page-text">
            Act {page.meta.act}, Scene {page.meta.scene}
          </h3>
          <p className="text-[13px] italic text-page-faint">{page.meta.title}</p>
        </header>

        {page.lines.map((line) => {
          if (line.sd) {
            prevSpeaker = "";
            return (
              <p
                key={`${line.ftln}`}
                className="px-6 py-1.5 text-center text-[12px] italic text-page-faint"
              >
                {line.text}
              </p>
            );
          }
          const showSpeaker = line.speaker && line.speaker !== prevSpeaker;
          prevSpeaker = line.speaker;
          const isActive = flash === line.ref;
          return (
            <div key={line.ftln}>
              {showSpeaker && (
                <div className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-page-faint">
                  {line.speaker}
                </div>
              )}
              <div
                ref={(el) => {
                  lineRefs.current[line.ref] = el;
                }}
                className={`book-line group cursor-pointer rounded-sm transition-colors hover:bg-work-light/10 ${
                  isActive ? "animate-book-jump" : ""
                }`}
                onClick={() => setSelected(line)}
              >
                <div className="book-ftln">{line.ref}</div>
                <div className="text-[15px] leading-relaxed">{line.text}</div>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-4 py-6 text-[12px] text-page-faint">
          <button className="hover:text-page-text disabled:opacity-30" onClick={() => turn(-1)} disabled={pageIndex === 0}>
            ‹ Previous scene
          </button>
          <button
            className="hover:text-page-text disabled:opacity-30"
            onClick={() => turn(1)}
            disabled={pageIndex === pages.length - 1}
          >
            Next scene ›
          </button>
        </div>
      </div>

      {/* Bidirectional book pane: pick a line -> "What about this?" (§4.2) */}
      {selected && (
        <div className="border-t border-page-line/70 bg-page-paper/95 px-4 py-3">
          <div className="mb-2 text-[12px] text-page-faint">
            <span className="font-mono text-page-cite">{selected.ref}</span>{" "}
            {selected.speaker}: “{selected.text.slice(0, 90)}
            {selected.text.length > 90 ? "…" : ""}”
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-page-cite/40 bg-page-cite/10 px-3 py-1.5 text-[13px] font-medium text-page-cite transition-colors hover:bg-page-cite/20"
              onClick={() => {
                onAskAbout?.(selected.ref, selected.text);
                setSelected(null);
              }}
            >
              What about this line?
            </button>
            <button
              className="rounded-md px-3 py-1.5 text-[13px] text-page-faint hover:text-page-text"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
