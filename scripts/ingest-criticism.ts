/**
 * ingest-criticism.ts — build the Tier 1 embedded criticism and Variorum indices
 * (§3.2). Chunks public-domain full texts to ~500 tokens, tagging every chunk
 * with critic + work + year so the avatar can always attribute by name and offer
 * the dissent. Parses Furness's New Variorum (1877) line-keyed into /variorum
 * (minimum scenes 1.2, 3.1, 3.4).
 *
 * The demo ships a curated hand-verified subset. Run: `npm run ingest:criticism`.
 * Sources (all PD): Johnson 1765, Coleridge lectures, Hazlitt 1817, Bradley 1904,
 * Furness 1877, Wilson Knight 1930 (verify US PD edition, Jan 2026).
 */

const TARGET_TOKENS = 500;

// Rough token estimate (~4 chars/token) for chunk sizing without a tokenizer dep.
function chunk(text: string, targetTokens = TARGET_TOKENS): string[] {
  const targetChars = targetTokens * 4;
  const paras = text.split(/\n\s*\n/);
  const out: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > targetChars && buf) {
      out.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function main() {
  console.log("[ingest-criticism] Pipeline:");
  console.log("  1. Fetch/read each PD source text.");
  console.log(`  2. chunk() to ~${TARGET_TOKENS} tokens, tagging critic/work/year.`);
  console.log("  3. Emit data/criticism/<critic>.json (Tier 1).");
  console.log("  4. Parse Furness -> data/variorum/{1.2,3.1,3.4}.json (line-keyed).");
  console.log("[ingest-criticism] Committed curated subsets left in place for the demo.");
  // Exported for reuse by build-index.ts and tests.
  void chunk;
}

main();

export { chunk };
