import { db } from "@next-js-notes-app/db";
import * as schema from "@next-js-notes-app/db/schema/auth";
import { createAuth } from "@next-js-notes-app/auth";
import type { NextRequest } from "next/server";
import { describe, expect, it, beforeEach } from "vitest";

import { authGuard } from "@/lib/auth-guard";
import { POST } from "@/app/api/auth/[...all]/route";

import pg from "pg";

const { Client } = pg;

const auth = createAuth();

const truncateTables = async () => {
  const admin = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  await admin.connect();
  await admin.query(`TRUNCATE "user", "session", "account", "verification" CASCADE`);
  await admin.end();
};

beforeEach(async () => {
  await truncateTables();
});

describe("auth", { sequential: true }, () => {
  it("signs up and stores a bcrypt-hashed (not plaintext) password", async () => {
    const result = await auth.api.signUpEmail({
      body: { email: "alice@example.com", name: "Alice", password: "password123" },
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe("alice@example.com");

    const [account] = await db.select().from(schema.account);
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe("password123");
    expect(account.password!.startsWith("$2")).toBe(true);
  });

  it("signs in with correct password and rejects a wrong one", async () => {
    await auth.api.signUpEmail({
      body: { email: "bob@example.com", name: "Bob", password: "password123" },
    });

    const ok = await auth.api.signInEmail({
      body: { email: "bob@example.com", password: "password123" },
    });
    expect(ok.user.email).toBe("bob@example.com");

    await expect(
      auth.api.signInEmail({
        body: { email: "bob@example.com", password: "wrong-password" },
      }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate email", async () => {
    await auth.api.signUpEmail({
      body: { email: "carol@example.com", name: "Carol", password: "password123" },
    });

    await expect(
      auth.api.signUpEmail({
        body: { email: "carol@example.com", name: "Carol Dupe", password: "password123" },
      }),
    ).rejects.toThrow();
  });

  it("signs out and invalidates the session", async () => {
    await auth.api.signUpEmail({
      body: { email: "dave@example.com", name: "Dave", password: "password123" },
    });
    const signedIn = await POST(
      new Request("http://localhost:3001/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "dave@example.com", password: "password123" }),
      }),
    );
    const setCookie = signedIn.headers.get("set-cookie");
    const sessionToken = setCookie?.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/)?.[1];
    expect(sessionToken).toBeTruthy();

    const before = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${sessionToken}` }),
    });
    expect(before).toBeTruthy();

    await auth.api.signOut({
      headers: new Headers({ cookie: `better-auth.session_token=${sessionToken}` }),
    });

    const after = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${sessionToken}` }),
    });
    expect(after).toBeNull();
  });
});

describe("authGuard", () => {
  const makeRequest = (url: string, cookie?: string) =>
    ({
      nextUrl: Object.assign(new URL(url), {
        clone: () => new URL(url),
      }),
      headers: new Headers(cookie ? { cookie } : {}),
    }) as unknown as NextRequest;

  it("redirects /dashboard to /login when no session cookie", () => {
    const result = authGuard(makeRequest("http://localhost:3001/dashboard"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("lets requests through when a session cookie is present", () => {
    const request = makeRequest("http://localhost:3001/dashboard", "better-auth.session_token=abc");
    expect(authGuard(request)).toBeNull();
  });

  it("ignores non-dashboard paths", () => {
    const request = makeRequest("http://localhost:3001/api/auth/sign-in/email");
    expect(authGuard(request)).toBeNull();
  });
});

describe("auth handler (toNextJsHandler)", () => {
  it("sets an httpOnly session cookie on sign-in", async () => {
    await auth.api.signUpEmail({
      body: { email: "erin@example.com", name: "Erin", password: "password123" },
    });

    const request = new Request("http://localhost:3001/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "erin@example.com", password: "password123" }),
    }) as NextRequest;

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("better-auth.session_token=");
    expect(setCookie).toContain("HttpOnly");
  });
});
