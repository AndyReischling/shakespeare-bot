"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatTurn, Mode, Skin } from "@/lib/types";

export interface TurnMeta {
  citations: string[];
  refusal: { id: string; statement: string } | null;
  method: string;
  score: number;
  register: string;
  delivery?: { direction: string; pauseBeforeMs: number };
  phaseAdvance?: { advanceLabel: string; nextPossible: boolean } | null;
  usedModel: boolean;
  licenseOk: boolean;
}

export interface Message extends ChatTurn {
  meta?: TurnMeta;
  streaming?: boolean;
}

interface SendArgs {
  mode: Mode;
  skin?: Skin;
  phase?: string;
  character?: string;
}

export function useDialogue(opening?: string) {
  const [messages, setMessages] = useState<Message[]>(
    opening ? [{ role: "assistant", content: opening }] : [],
  );
  const [streaming, setStreaming] = useState(false);
  const [lastMeta, setLastMeta] = useState<TurnMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (
      input: string,
      args: SendArgs,
      onMeta?: (m: TurnMeta) => void,
      opts?: { hideUser?: boolean },
    ) => {
      if (streaming || !input.trim()) return;
      setStreaming(true);

      // An opening turn carries no history and shows no user bubble.
      const history: ChatTurn[] = opts?.hideUser
        ? []
        : messages.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        ...(opts?.hideUser ? [] : [{ role: "user", content: input } as Message]),
        { role: "assistant", content: "", streaming: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args, history, input }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const reason = await res.text().catch(() => "Something went wrong.");
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: reason || "The room is quiet for a moment. Try again.",
            };
            return next;
          });
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        const flushEvents = () => {
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const chunk of events) {
            const lines = chunk.split("\n");
            const evLine = lines.find((l) => l.startsWith("event:"));
            const dataLine = lines.find((l) => l.startsWith("data:"));
            if (!evLine || !dataLine) continue;
            const ev = evLine.slice(6).trim();
            const data = JSON.parse(dataLine.slice(5).trim());
            if (ev === "meta") {
              setLastMeta(data as TurnMeta);
              onMeta?.(data as TurnMeta);
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], meta: data };
                return next;
              });
            } else if (ev === "delta") {
              acc += data.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: acc,
                  streaming: true,
                };
                return next;
              });
            } else if (ev === "done") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], streaming: false };
                return next;
              });
            }
          }
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          flushEvents();
        }
        flushEvents();
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          if (next.length && next[next.length - 1].role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              content: "The connection dropped mid-line. Try that again.",
            };
          }
          return next;
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const reset = useCallback(
    (nextOpening?: string) => {
      abortRef.current?.abort();
      setMessages(nextOpening ? [{ role: "assistant", content: nextOpening }] : []);
      setLastMeta(null);
      setStreaming(false);
    },
    [],
  );

  return { messages, send, reset, streaming, lastMeta };
}
