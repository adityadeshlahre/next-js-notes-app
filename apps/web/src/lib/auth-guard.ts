import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function authGuard(request: NextRequest): NextResponse | null {
  if (!request.nextUrl.pathname.startsWith("/dashboard")) return null;

  const sessionCookie = getSessionCookie(request);
  if (sessionCookie) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}
