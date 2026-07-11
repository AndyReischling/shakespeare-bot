"use client";

import { useState } from "react";

// "Leave the Director a note" (§8 footer).
export function FeedbackNote() {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        try {
          await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note }),
          });
        } catch {
          /* best-effort; the note is non-critical */
        }
        setSent(true);
        setNote("");
      }}
    >
      <label className="worklabel sm:sr-only">Leave the Director a note</label>
      <input
        className="flex-1 rounded-md border border-stage-edge bg-stage-deep px-3 py-2 text-sm text-stage-ink placeholder:text-stage-faint focus:border-work-deep"
        placeholder={sent ? "Thanks — noted." : "Leave the Director a note…"}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSent(false);
        }}
      />
      <button className="btn-ghost" type="submit">
        Send
      </button>
    </form>
  );
}
