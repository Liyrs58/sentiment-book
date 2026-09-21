/**
 * Optional: compare ProsusAI FinBERT dump vs lexicon on a small sample.
 * Reports agreement — does NOT claim equality.
 */
import { existsSync, readFileSync } from "fs";
import { lexiconScore, signedScore, labelForScore } from "../lib/sentiment";
import { getDeskWire } from "../lib/corpus";

const cachePath = "data/finbert-cache.json";
if (!existsSync(cachePath)) {
  console.log(
    JSON.stringify({
      status: "NOT RUN",
      reason: "No data/finbert-cache.json — run npm run score:finbert first",
      claim: "No equality claimed between lexicon and FinBERT",
    }, null, 2)
  );
  process.exit(0);
}

const dump = JSON.parse(readFileSync(cachePath, "utf8")) as {
  items?: { text: string; scores: { positive: number; negative: number; neutral: number } }[];
};
const byText = new Map(
  (dump.items ?? []).map((i) => [i.text.trim(), i.scores])
);

const sample = getDeskWire().slice(0, 24);
let compared = 0;
let labelAgree = 0;
let signAgree = 0;
const rows: unknown[] = [];

for (const a of sample) {
  const text = `${a.headline}. ${a.dek}`.trim();
  const fb = byText.get(text);
  if (!fb) continue;
  const lx = lexiconScore(text);
  const sFb = signedScore(fb);
  const sLx = signedScore(lx);
  const agreeLabel = labelForScore(sFb) === labelForScore(sLx);
  const agreeSign = Math.sign(sFb) === Math.sign(sLx) || (Math.abs(sFb) < 0.05 && Math.abs(sLx) < 0.05);
  compared += 1;
  if (agreeLabel) labelAgree += 1;
  if (agreeSign) signAgree += 1;
  rows.push({
    id: a.id,
    finbertSigned: sFb,
    lexiconSigned: sLx,
    labelAgree: agreeLabel,
  });
}

console.log(
  JSON.stringify(
    {
      status: compared ? "RAN" : "NOT RUN",
      compared,
      labelAgreement: compared ? labelAgree / compared : null,
      signAgreement: compared ? signAgree / compared : null,
      note: "Agreement rates only — lexicon is not FinBERT; do not claim equality.",
      sample: rows.slice(0, 8),
    },
    null,
    2
  )
);
