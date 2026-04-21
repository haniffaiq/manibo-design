import { NextResponse } from "next/server";
import { SESSION_COOKIE, PLATFORM_API_TOKEN_COOKIE } from "@/lib/platform_auth";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(PLATFORM_API_TOKEN_COOKIE);
  return response;
}
