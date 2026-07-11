// Embeddings provider seam (spec §1/§3). Production wires a real provider and a
// file-based vector store; the demo defaults to "local" so nothing depends on a
// key. Cosine similarity is shared by both paths.

export type EmbeddingProvider = "openai" | "voyage" | "local";

export function activeProvider(): EmbeddingProvider {
  const p = (process.env.EMBEDDING_PROVIDER || "local").toLowerCase();
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "voyage" && process.env.VOYAGE_API_KEY) return "voyage";
  return "local";
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Deterministic local embedding: hashed bag-of-tokens into a fixed vector.
// Not semantic, but stable and infra-free — used as the offline fallback and to
// keep the vector-store code path exercised without a provider.
const DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hash(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % DIM;
}

export function localEmbed(text: string): number[] {
  const v = new Array(DIM).fill(0);
  for (const tok of tokenize(text)) {
    v[hash(tok)] += 1;
  }
  return v;
}

export async function embed(text: string): Promise<number[]> {
  const provider = activeProvider();
  if (provider === "openai") {
    return openaiEmbed(text);
  }
  if (provider === "voyage") {
    return voyageEmbed(text);
  }
  return localEmbed(text);
}

async function openaiEmbed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

async function voyageEmbed(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: "voyage-3-lite", input: text }),
  });
  if (!res.ok) throw new Error(`Voyage embeddings failed: ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}
