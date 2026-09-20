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

/** Honest edition stamp — never a fake clock. */
export function editionCloseStamp(month: string): string {
  return `As of edition close · ${editionDate(month)}`;
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
