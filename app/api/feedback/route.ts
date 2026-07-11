import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { note } = await req.json();
    if (typeof note === "string" && note.trim()) {
      // eslint-disable-next-line no-console
      console.log("[feedback]", JSON.stringify({ ts: new Date().toISOString(), note: note.slice(0, 2000) }));
    }
  } catch {
    /* ignore */
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
