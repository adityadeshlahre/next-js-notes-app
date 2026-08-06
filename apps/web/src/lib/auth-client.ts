import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});

export function clearSessionCookies() {
  document.cookie = "better-auth.session_token=; Max-Age=0; Path=/";
  document.cookie = "__Secure-better-auth.session_token=; Max-Age=0; Path=/";
}
