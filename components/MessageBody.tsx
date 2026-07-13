"use client";

import React from "react";

// Renders assistant/user text, turning act.scene.line references into citation
// chips that jump the book pane (§4.2). For assistant turns, the closing Socratic
// question — the one move Shakespeare hands back each turn — is visually
// emphasized so the ask is unmissable.

const REF_RE = /\b\d\.\d\.\d{1,3}\b/g;

function renderLine(
  line: string,
  li: number,
  onCite?: (ref: string) => void,
  plainCites?: boolean,
): React.ReactNode[] {
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const parts: React.ReactNode[] = [];
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(line))) {
    if (m.index > lastIndex) parts.push(line.slice(lastIndex, m.index));
    const ref = m[0];
    if (plainCites) {
      // Colloquy: no book pane to jump; references are styled text, not buttons.
      parts.push(
        <span key={`${li}-${m.index}`} className="font-mono text-[13px] text-work-glow">
          {ref}
        </span>,
      );
    } else {
      parts.push(
        <button
          key={`${li}-${m.index}`}
          className="cite-chip"
          onClick={() => onCite?.(ref)}
          title={`Jump the book to ${ref}`}
        >
          {ref}
        </button>,
      );
    }
    lastIndex = m.index + ref.length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

export function MessageBody({
  text,
  onCite,
  emphasizeQuestion = false,
  plainCites = false,
}: {
  text: string;
  onCite?: (ref: string) => void;
  emphasizeQuestion?: boolean;
  plainCites?: boolean;
}) {
  const lines = text.split("\n");

  // The final non-empty paragraph, when it carries a question, is the move of
  // the turn — set it apart.
  let questionIdx = -1;
  if (emphasizeQuestion) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        if (lines[i].includes("?")) questionIdx = i;
        break;
      }
    }
  }

  const nodes: React.ReactNode[] = lines.map((line, li) => {
    const parts = renderLine(line, li, onCite, plainCites);
    if (li === questionIdx) {
      return (
        <p
          key={li}
          className="display mt-3 border-l-2 border-work-light pl-3 text-[17px] italic leading-relaxed text-stage-ink"
        >
          {parts.length ? parts : line}
        </p>
      );
    }
    return (
      <p key={li} className={li > 0 ? "mt-2" : ""}>
        {parts.length ? parts : line || "\u00a0"}
      </p>
    );
  });

  return <div className="whitespace-pre-wrap leading-relaxed">{nodes}</div>;
}
