// Anthropic client helper. The single dialogue engine (spec §1). Everything is
// written so that a missing key degrades gracefully rather than dead-ending —
// an unattended demo is judged by its worst screen.

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
export function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// One cheap, non-streaming classification call (used by the refusal matcher's
// ambiguous band, §3.3). Returns true/false; on any failure returns null so the
// caller can fall back to the lexical decision.
export async function classifyYesNo(question: string): Promise<boolean | null> {
  if (!hasAnthropic()) return null;
  try {
    const res = await client().messages.create({
      model: MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: question }],
      system:
        "You are a strict binary classifier. Answer with exactly one word: YES or NO. No punctuation, no explanation.",
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .toUpperCase();
    if (text.startsWith("Y")) return true;
    if (text.startsWith("N")) return false;
    return null;
  } catch {
    return null;
  }
}
