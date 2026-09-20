import { NextResponse } from "next/server";
import {
  accessCodeMatches,
  gateCookieOptions,
  hasValidGateCookie,
  issueGateToken,
} from "@/lib/auth";
import { GATE_COOKIE, isAuthRequired } from "@/lib/flags";

export async function GET(request: Request) {
  return NextResponse.json({
    required: isAuthRequired(),
    authenticated: hasValidGateCookie(request.headers.get("cookie")),
  });
}

export async function POST(request: Request) {
  if (!isAuthRequired()) {
    return NextResponse.json({ ok: true, required: false, authenticated: true });
  }
  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (!accessCodeMatches(body.code ?? "")) {
    return NextResponse.json({ ok: false, error: "Invalid access code." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, required: true, authenticated: true });
  res.cookies.set(GATE_COOKIE, issueGateToken(), gateCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, authenticated: false, required: isAuthRequired() });
  res.cookies.set(GATE_COOKIE, "", { ...gateCookieOptions(), maxAge: 0 });
  return res;
}
