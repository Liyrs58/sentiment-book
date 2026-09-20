import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  GATE_TTL_MS,
  authSecret,
  isAuthRequired,
} from "./flags";

function hmac(value: string): string {
  return createHmac("sha256", authSecret()).update(value).digest("hex");
}

function hashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function issueGateToken(now = Date.now()): string {
  const exp = String(now + GATE_TTL_MS);
  return `v1.${exp}.${hmac(`v1.${exp}`)}`;
}

export function verifyGateToken(token: string, now = Date.now()): boolean {
  if (!isAuthRequired() || !authSecret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= now) return false;
  return hashesEqual(parts[2], hmac(`v1.${parts[1]}`));
}

export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return null;
}

export function hasValidGateCookie(cookieHeader: string | null | undefined): boolean {
  if (!isAuthRequired()) return true;
  const token = readCookie(cookieHeader, GATE_COOKIE);
  return Boolean(token && verifyGateToken(token));
}

export function accessCodeMatches(code: string): boolean {
  const expected = process.env.DEMO_ACCESS_CODE?.trim() ?? "";
  if (!expected) return false;
  const submitted = code.trim();
  return hashesEqual(hmac(`code.${submitted}`), hmac(`code.${expected}`)) && submitted === expected;
}

export function gateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(GATE_TTL_MS / 1000),
  };
}

/** Authoritative API check. Proxy is only an optimistic redirect. */
export function unauthorizedIfGated(request: Request): NextResponse | null {
  if (hasValidGateCookie(request.headers.get("cookie"))) return null;
  return NextResponse.json({ error: "Access code required." }, { status: 401 });
}
