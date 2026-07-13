// Diagnostic endpoint: reports whether the model path works from this
// deployment, and if not, why. Never exposes the key itself.

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const raw = process.env.ANTHROPIC_API_KEY ?? "";
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const info: Record<string, unknown> = {
    keyPresent: raw.length > 0,
    keyLength: raw.length,
    // Whitespace, newlines, or quotes pasted around the key are the usual culprits.
    keyHasWhitespaceOrQuotes: raw !== raw.trim() || /["'\s]/.test(raw),
    keyPrefixOk: raw.trim().startsWith("sk-ant-"),
    model,
  };

  if (!raw) {
    return Response.json({ ...info, verdict: "ANTHROPIC_API_KEY is not set in this environment." });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": raw.trim(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: "user", content: "say ok" }],
      }),
    });
    info.anthropicStatus = res.status;
    if (res.ok) {
      info.verdict = "OK — the model answers from this deployment.";
    } else {
      const body = await res.text();
      info.anthropicError = body.slice(0, 400);
      info.verdict = "The key reached Anthropic but the call was rejected; see anthropicError.";
    }
  } catch (e) {
    info.fetchError = String(e).slice(0, 400);
    info.verdict = "Could not reach the Anthropic API from this deployment; see fetchError.";
  }

  return Response.json(info);
}
