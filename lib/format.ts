export function pct(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n * 100).toFixed(digits)}%`;
}

export function pctPlain(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function num(n: number, digits = 2): string {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function monthLabel(month: string): string {
  if (month === "start") return "Dec 2023";
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function editionDate(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 12)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Edition stamp — bound to the selected month, never a frozen clock. */
export function editionCloseStamp(month: string): string {
  return `Edition close · ${editionDate(month)}`;
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function chartTick(month: string): string {
  if (month === "start") return "Dec 2023";
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function signedChip(n: number): string {
  if (n > 0) return `+${n.toFixed(2)}`;
  if (n < 0) return `−${Math.abs(n).toFixed(2)}`;
  return n.toFixed(2);
}

/** Weight delta in basis points. 0.01 of the book = 100 bp. */
export function formatBp(delta: number): string {
  const bp = Math.round(delta * 10000);
  if (bp > 0) return `+${bp} bp`;
  if (bp < 0) return `−${Math.abs(bp)} bp`;
  return "0 bp";
}

/** Two-line dek: cut on a word boundary, never mid-token. */
export function clampWords(text: string, maxChars = 148): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const cut = slice.lastIndexOf(" ");
  const kept = (cut > 48 ? slice.slice(0, cut) : slice).replace(/[.,;:]+$/, "");
  return `${kept}…`;
}

/** Negative scores are always brick; teal is reserved for clear positives. */
export function scoreClass(signed: number): string {
  if (signed < 0) return "text-[#9A3412]";
  if (signed >= 0.18) return "text-[#0F766E]";
  return "text-[#6B7280]";
}
