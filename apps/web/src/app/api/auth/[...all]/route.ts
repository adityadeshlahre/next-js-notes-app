import { auth } from "@next-js-notes-app/auth";
import { getSessionCookie } from "better-auth/cookies";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST: handleAuth } = toNextJsHandler(auth);

const AUTH_PATHS = ["/api/auth/sign-in/email", "/api/auth/sign-up/email"];

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  const next = AUTH_PATHS.some((path) => pathname.endsWith(path))
    ? await clearStaleSession(request)
    : request;
  return handleAuth(next);
}

async function clearStaleSession(request: Request): Promise<Request> {
  if (!getSessionCookie(request)) return request;
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) return request;
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  return new Request(request, { headers });
}

export { GET };
