import { auth } from "@next-js-notes-app/auth";
import { NextResponse } from "next/server";

export type SessionUser = { id: string; email: string; name: string };
export type ErrorResponse = NextResponse<{ message: string }>;

export function jsonError(status: number, message: string): ErrorResponse {
  return NextResponse.json({ message }, { status });
}

export async function requireUser(
  headers: Headers,
): Promise<{ user: SessionUser } | ErrorResponse> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    return jsonError(401, "Unauthorized");
  }
  return { user: session.user as SessionUser };
}

export function isErrorResponse(
  result: { user: SessionUser } | ErrorResponse,
): result is ErrorResponse {
  return result instanceof NextResponse;
}

export function requestHeaders(request: Request): Headers {
  return request.headers;
}
