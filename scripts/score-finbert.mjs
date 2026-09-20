/**
 * Optional local FinBERT pass.
 *
 * Tries @huggingface/transformers with Xenova/finbert (ONNX port of
 * ProsusAI/finbert). Writes data/finbert-cache.json. Falls back to lexicon
 * if the package or model is missing — never fails the default QA path.
 *
 *   npm run score:finbert
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

async function loadCorpus() {
  const { getRawCorpus } = await import("../lib/corpus");
  return getRawCorpus();
}

async function tryFinbert(texts) {
  let pipeline;
  try {
    ({ pipeline } = await import("@huggingface/transformers"));
  } catch {
    try {
      ({ pipeline } = require("@xenova/transformers"));
    } catch {
      return null;
    }
  }
  const clf = await pipeline("text-classification", "Xenova/finbert", {
    topk: 3,
  });
  const items = [];
  for (const text of texts) {
    const raw = await clf(text);
    const rows = Array.isArray(raw[0]) ? raw[0] : raw;
    const map = { positive: 0, negative: 0, neutral: 0 };
    for (const row of rows) {
      const key = String(row.label).toLowerCase();
      if (key in map) map[key] = row.score;
    }
    const sum = map.positive + map.negative + map.neutral;
    items.push({
      text,
      scores:
        sum > 0
          ? {
              positive: map.positive / sum,
              negative: map.negative / sum,
              neutral: map.neutral / sum,
            }
          : { positive: 0.18, negative: 0.16, neutral: 0.66 },
    });
  }
  return items;
}

async function main() {
  const corpus = await loadCorpus();
  const texts = corpus.map((a) => `${a.headline}. ${a.dek}`);
  console.log(`Scoring ${texts.length} headlines…`);
  let items = null;
  try {
    items = await tryFinbert(texts);
  } catch (err) {
    console.warn("FinBERT local load failed:", err?.message ?? err);
  }
  if (!items) {
    const { lexiconScore } = await import("../lib/sentiment");
    items = texts.map((text) => ({ text, scores: lexiconScore(text) }));
    console.log("Wrote lexicon dump (FinBERT model not installed).");
  } else {
    console.log("Wrote Xenova/finbert dump.");
  }
  const outDir = path.join(process.cwd(), "data");
  await mkdir(outDir, { recursive: true });
  const out = path.join(outDir, "finbert-cache.json");
  await writeFile(
    out,
    JSON.stringify(
      {
        model: items[0] && items[0]._finbert ? "Xenova/finbert" : "lexicon-or-finbert",
        items,
      },
      null,
      2
    )
  );
  console.log(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
