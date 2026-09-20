import { NextResponse } from "next/server";
import { healthPayload } from "@/lib/health";

export async function GET() {
  return NextResponse.json(healthPayload());
}
