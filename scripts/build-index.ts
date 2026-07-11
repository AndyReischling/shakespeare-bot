/**
 * build-index.ts — build the file-based vector store (§1). Dual-index: per-speech
 * and per-scene for the play, plus a criticism index. Uses the configured
 * embeddings provider (EMBEDDING_PROVIDER); with "local" it exercises the same
 * code path deterministically so the store format is validated without a key.
 *
 * Output: data/index/*.vec.json (git-ignored; regenerated on deploy). Retrieval
 * reads these when present and falls back to the lexical scorer otherwise.
 *
 * Run: `npm run build:index`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import hamlet from "../data/hamlet.json";
import tier1 from "../data/criticism/tier1.json";
import { embed, activeProvider } from "../lib/embeddings";

const OUT_DIR = resolve(process.cwd(), "data/index");

interface Vec {
  id: string;
  ref?: string;
  vector: number[];
}

async function embedAll(items: { id: string; ref?: string; text: string }[]): Promise<Vec[]> {
  const out: Vec[] = [];
  for (const it of items) {
    out.push({ id: it.id, ref: it.ref, vector: await embed(it.text) });
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const provider = activeProvider();
  console.log(`[build-index] provider = ${provider}`);

  const lines = (hamlet as any).lines as any[];
  const speechItems = lines.map((l) => ({ id: l.ref, ref: l.ref, text: `${l.speaker}: ${l.text}` }));

  const sceneAgg = new Map<string, string>();
  for (const l of lines) {
    const id = `${l.act}.${l.scene}`;
    sceneAgg.set(id, (sceneAgg.get(id) || "") + " " + l.text);
  }
  const sceneItems = Array.from(sceneAgg.entries()).map(([id, text]) => ({ id, text }));

  const crit = (tier1 as any).chunks as any[];
  const critItems = crit.map((c) => ({ id: c.id, text: `${c.critic} ${c.work} ${c.text}` }));

  const [speeches, scenes, criticism] = await Promise.all([
    embedAll(speechItems),
    embedAll(sceneItems),
    embedAll(critItems),
  ]);

  await writeFile(resolve(OUT_DIR, "speeches.vec.json"), JSON.stringify(speeches));
  await writeFile(resolve(OUT_DIR, "scenes.vec.json"), JSON.stringify(scenes));
  await writeFile(resolve(OUT_DIR, "criticism.vec.json"), JSON.stringify(criticism));

  console.log(
    `[build-index] wrote ${speeches.length} speeches, ${scenes.length} scenes, ${criticism.length} criticism vectors to ${OUT_DIR}`,
  );
}

main();
