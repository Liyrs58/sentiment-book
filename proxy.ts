import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyGateToken } from "@/lib/auth";
import { GATE_COOKIE, isAuthRequired } from "@/lib/flags";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/gate" || pathname.startsWith("/gate/")) return true;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/health" || pathname.startsWith("/api/health/")) return true;
  return false;
}

export function proxy(request: NextRequest) {
  if (!isAuthRequired()) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(GATE_COOKIE)?.value;
  if (token && verifyGateToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Access code required." }, { status: 401 });
  }
  const gate = request.nextUrl.clone();
  gate.pathname = "/gate";
  gate.searchParams.set("next", pathname);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
