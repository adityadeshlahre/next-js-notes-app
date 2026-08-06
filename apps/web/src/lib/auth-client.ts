import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token";

export function clearSessionCookies() {
  document.cookie = `${SESSION_COOKIE}=; Max-Age=0; Path=/`;
  document.cookie = `${SECURE_SESSION_COOKIE}=; Max-Age=0; Path=/`;
}

type AuthError = {
  code?: string;
  message?: string;
  status: number;
  statusText: string;
};

export async function retryAfterStaleSession<T>(
  attempt: () => Promise<{ data: T | null; error: AuthError | null }>,
): Promise<{ data: T | null; error: AuthError | null }> {
  let result = await attempt();
  if (result.error?.status === 403) {
    clearSessionCookies();
    result = await attempt();
  }
  if (result.error?.status === 403) {
    window.location.reload();
  }
  return result;
}
