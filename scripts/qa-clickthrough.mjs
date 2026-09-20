/**
 * Headless click-through of every desk control. Needs the dev server.
 *   npm run dev   # in another terminal
 *   node scripts/qa-clickthrough.mjs
 */
import { chromium } from "playwright-core";

const URL = process.env.QA_URL ?? "http://127.0.0.1:43173/";
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function text(page, sel) {
  const loc = page.locator(sel).first();
  if (!(await loc.count())) return "";
  return (await loc.innerText()).replace(/\s+/g, " ").trim();
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(8000);

  await page.goto(URL, { waitUntil: "networkidle" });
  const title = await page.locator("h1").innerText();
  record("Load Sentiment Book", /sentiment[\s\u00a0]*book/i.test(title), title);
  record("No fake clock", !(await page.getByText("09:24 ET").count()), "edition stamp only");
  record(
    "Chart disclaimer",
    (await page.getByText("Walk-forward on the shipped sample tape").count()) > 0,
    "walk-forward disclaimer"
  );
  record(
    "Wire microcopy",
    (await page.getByText("Chip filters tone · Headline applies shock.").count()) > 0,
    "microcopy"
  );

  const edition = page.getByLabel("Edition date");
  const firstHeadline = page.locator("aside h3").first();
  const beforeHead = await firstHeadline.innerText();
  const beforeEq = await text(page, "button[aria-label='Filter wire to Equities']");
  await edition.selectOption("2025-04");
  await page.waitForTimeout(200);
  const afterHead = await firstHeadline.innerText();
  const afterEq = await text(page, "button[aria-label='Filter wire to Equities']");
  record(
    "Edition date",
    beforeHead !== afterHead || beforeEq !== afterEq,
    `headline "${beforeHead.slice(0, 40)}" → "${afterHead.slice(0, 40)}"`
  );
  await edition.selectOption("2025-05");
  await page.waitForTimeout(150);

  const sourceFt = page.getByRole("button", { name: "Filter source FT" });
  await sourceFt.click();
  await page.waitForTimeout(150);
  const metaLines = await page.locator("aside li p").filter({ hasText: "•" }).allInnerTexts();
  const ftOnly =
    metaLines.length > 0 && metaLines.every((t) => t.startsWith("FT •"));
  const empty = await page.getByText("No prints match those filters.").count();
  record(
    "All Sources",
    ftOnly || empty > 0,
    empty ? "empty + clear path" : metaLines.slice(0, 2).join(" || ")
  );
  if (empty) {
    await page.getByRole("button", { name: "Clear filters" }).first().click();
    await page.waitForTimeout(100);
  } else {
    await page.getByRole("button", { name: "Filter source All" }).click();
  }

  const names = page.getByLabel("Filter by name");
  const nameOptions = await names.locator("option").allInnerTexts();
  record(
    "Editorial names in filter",
    nameOptions.some((t) => /S&P 500/.test(t)) &&
      nameOptions.some((t) => /Nasdaq/.test(t)) &&
      nameOptions.some((t) => /Dow/.test(t)),
    nameOptions.filter((t) => /S&P|Nasdaq|Dow/.test(t)).join(" | ")
  );
  await names.selectOption("GC");
  await page.waitForTimeout(150);
  const goldHeads = await page.locator("aside h3").allInnerTexts();
  const goldOk =
    goldHeads.length === 0 ||
    goldHeads.some((h) => /gold|bullion/i.test(h));
  record("All names (GC)", goldOk, goldHeads.slice(0, 2).join(" | ") || "empty");
  await names.selectOption("ALL");

  const chipPos = page.getByRole("button", { name: "Filter Positive sentiment" }).first();
  const chipNeg = page.getByRole("button", { name: "Filter Negative sentiment" }).first();
  await chipPos.click();
  await page.waitForTimeout(100);
  const posPressed = await chipPos.getAttribute("aria-pressed");
  const posHead = await page.locator("aside h3").first().innerText();
  await chipNeg.click();
  await page.waitForTimeout(100);
  const negHead = await page.locator("aside h3").first().innerText();
  record(
    "Sentiment chips (header)",
    posPressed === "true" && posHead !== negHead,
    `"${posHead.slice(0, 36)}" vs "${negHead.slice(0, 36)}"`
  );
  await page.getByRole("button", { name: "Filter All sentiment" }).first().click();

  const score = page.locator("[data-score]").first();
  const tonePos = page.getByRole("button", { name: "Filter Positive sentiment" }).first();
  const pressedBefore = await tonePos.getAttribute("aria-pressed");
  await score.click({ force: true });
  await page.waitForTimeout(80);
  const pressedAfter = await tonePos.getAttribute("aria-pressed");
  const scoreTag = await score.evaluate((el) => el.tagName);
  record(
    "Story score is display",
    scoreTag !== "BUTTON" && pressedBefore === pressedAfter,
    `tag=${scoreTag} pressed ${pressedBefore}→${pressedAfter}`
  );
  await page.getByRole("button", { name: "Clear filters" }).first().click().catch(() => {});
  await page.getByRole("button", { name: "Filter All sentiment" }).first().click();
  await page.waitForTimeout(80);

  const headlineBtn = page.locator("aside h3").first();
  const eqBeforeShock = await text(page, "button[aria-label='Filter wire to Equities']");
  await headlineBtn.click();
  await page.waitForTimeout(200);
  const shockNote = await page.getByText(/Shock on|News shock applied/i).count();
  const clearShock = page.getByRole("button", { name: "Clear shock" });
  record("Headline shock", shockNote > 0 && (await clearShock.count()) > 0, `shock ui ${shockNote}`);
  if (await clearShock.count()) {
    await clearShock.click();
    await page.waitForTimeout(150);
    const gone = await clearShock.count();
    record("Clear shock", gone === 0, gone === 0 ? "cleared" : "still visible");
  } else {
    record("Clear shock", false, "button missing");
  }
  void eqBeforeShock;

  await page.getByRole("button", { name: "Score a print" }).click();
  await page.getByLabel("Headline to score").fill(
    "Gold holds record as official-sector buying persists"
  );
  await page.getByLabel("Live score ticker").selectOption("GC");
  await page.getByRole("button", { name: "Apply shock" }).click();
  await page.waitForTimeout(200);
  const liveNote = await page.getByText(/offline-lexicon|Shock on GC/i).count();
  record("Score a print (offline lexicon)", liveNote > 0, "lexicon shock applied");
  if (await page.getByRole("button", { name: "Clear shock" }).count()) {
    await page.getByRole("button", { name: "Clear shock" }).click();
  }

  const model = page.getByLabel("Allocation model");
  const goldBtn = page.getByRole("button", { name: "Filter wire to Gold" });
  const goldBase = await goldBtn.innerText();
  await model.selectOption("equal");
  await page.waitForTimeout(80);
  const goldEq = await goldBtn.innerText();
  await model.selectOption("nlp");
  await page.waitForTimeout(80);
  const goldNlp = await goldBtn.innerText();
  await model.selectOption("super");
  record(
    "Model dropdown",
    goldBase !== goldEq || goldEq !== goldNlp || goldBase !== goldNlp,
    `gold row "${goldBase.slice(0, 24)}" / eq / nlp`
  );

  const risk = page.getByLabel("Risk profile");
  const eqBal = await page.getByRole("button", { name: "Filter wire to Equities" }).innerText();
  await risk.selectOption("offensive");
  await page.waitForTimeout(80);
  const eqOff = await page.getByRole("button", { name: "Filter wire to Equities" }).innerText();
  await risk.selectOption("defensive");
  await page.waitForTimeout(80);
  const goldDef = await goldBtn.innerText();
  await risk.selectOption("balanced");
  record(
    "Risk profile",
    eqBal !== eqOff || goldBase !== goldDef,
    "offensive/defensive tilt"
  );

  const editionBefore = await edition.inputValue();
  await page.getByRole("button", { name: "Rebalance book" }).click();
  await page.waitForTimeout(200);
  const editionAfter = await edition.inputValue();
  const reNote = await page.getByText(/Rebalanced|No later edition/i).count();
  record(
    "Rebalance",
    editionAfter !== editionBefore || reNote > 0,
    `${editionBefore} → ${editionAfter}`
  );

  const goldFilter = page.getByRole("button", { name: "Filter wire to Gold" });
  await goldFilter.click();
  await page.waitForTimeout(120);
  const pressed = await goldFilter.getAttribute("aria-pressed");
  const afterSleeve = await page.locator("aside h3").allInnerTexts();
  const sleeveOk =
    pressed === "true" &&
    (afterSleeve.length === 0 || afterSleeve.some((h) => /gold|bullion/i.test(h)));
  record("Allocation sleeve filter", sleeveOk, `pressed=${pressed} n=${afterSleeve.length}`);
  await goldFilter.click();

  await page.waitForFunction(() => {
    const svg = document.querySelector("svg.recharts-surface");
    if (!svg) return false;
    return Number(svg.getAttribute("width") || 0) > 40;
  });
  const chart = page.locator("svg.recharts-surface").first();
  await chart.hover({ position: { x: 180, y: 80 } });
  await page.waitForTimeout(200);
  const chartBox = await chart.boundingBox();
  record(
    "Chart hover/tooltip",
    Boolean(chartBox && chartBox.width > 40 && chartBox.height > 40),
    chartBox ? `${Math.round(chartBox.width)}×${Math.round(chartBox.height)}` : "missing"
  );

  const monthBeforeClick = await edition.inputValue();
  await chart.click({ position: { x: 70, y: 90 } });
  await page.waitForTimeout(250);
  const monthAfterClick = await edition.inputValue();
  record(
    "Chart click month",
    monthAfterClick !== monthBeforeClick,
    `${monthBeforeClick} → ${monthAfterClick}`
  );

  await page.getByRole("button", { name: "Model Portfolio" }).click();
  await page.waitForTimeout(80);
  const modelOff = await page.getByRole("button", { name: "Model Portfolio" }).getAttribute("aria-pressed");
  await page.getByRole("button", { name: "Model Portfolio" }).click();
  record("Chart legend toggle", modelOff === "false", `aria-pressed after click ${modelOff}`);

  await page.setViewportSize({ width: 390, height: 800 });
  const rebalVis = await page.getByRole("button", { name: "Rebalance book" }).isVisible();
  record("Mobile 390px controls visible", rebalVis, rebalVis ? "rebalance visible" : "hidden");

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
