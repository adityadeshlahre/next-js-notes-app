import { db } from "@next-js-notes-app/db";
import * as schema from "@next-js-notes-app/db/schema/auth";
import { createAuth } from "@next-js-notes-app/auth";
import type { NextRequest } from "next/server";
import { describe, expect, it, beforeEach } from "vitest";

import { authGuard } from "@/lib/auth-guard";
import { proxy } from "@/proxy";
import { POST } from "@/app/api/auth/[...all]/route";

import pg from "pg";

const { Client } = pg;

const PASSWORD = "password123";
const SIGN_IN_URL = "http://localhost:3001/api/auth/sign-in/email";
const SESSION_COOKIE = "better-auth.session_token";

const auth = createAuth();

const truncateTables = async () => {
  const admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`TRUNCATE "user", "session", "account", "verification" CASCADE`);
  await admin.end();
};

beforeEach(async () => {
  await truncateTables();
});

const signUp = (email: string) =>
  auth.api.signUpEmail({ body: { email, name: email.split("@")[0], password: PASSWORD } });

const signInRequest = (email: string) =>
  new Request(SIGN_IN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  }) as NextRequest;

async function signInCookie(email: string): Promise<string> {
  const response = await POST(signInRequest(email));
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  const match = setCookie?.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
  expect(match).toBeTruthy();
  return match![1];
}

describe("auth", { sequential: true }, () => {
  it("signs up and stores a bcrypt-hashed (not plaintext) password", async () => {
    const result = await signUp("alice@example.com");

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe("alice@example.com");

    const [account] = await db.select().from(schema.account);
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe(PASSWORD);
    expect(account.password!.startsWith("$2")).toBe(true);
  });

  it("signs in with correct password and rejects a wrong one", async () => {
    await signUp("bob@example.com");

    const ok = await auth.api.signInEmail({
      body: { email: "bob@example.com", password: PASSWORD },
    });
    expect(ok.user.email).toBe("bob@example.com");

    await expect(
      auth.api.signInEmail({ body: { email: "bob@example.com", password: "wrong-password" } }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate email", async () => {
    await signUp("carol@example.com");

    await expect(
      auth.api.signUpEmail({
        body: { email: "carol@example.com", name: "Carol Dupe", password: PASSWORD },
      }),
    ).rejects.toThrow();
  });

  it("signs out via the HTTP route and invalidates the session", async () => {
    await signUp("dave@example.com");
    const token = await signInCookie("dave@example.com");

    const before = await auth.api.getSession({
      headers: new Headers({ cookie: `${SESSION_COOKIE}=${token}` }),
    });
    expect(before).toBeTruthy();

    const signOutResponse = await POST(
      new Request("http://localhost:3001/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE}=${token}` },
      }) as NextRequest,
    );
    expect(signOutResponse.ok).toBe(true);

    const after = await auth.api.getSession({
      headers: new Headers({ cookie: `${SESSION_COOKIE}=${token}` }),
    });
    expect(after).toBeNull();
  });
});

describe("authGuard", () => {
  const makeRequest = (url: string, cookie?: string) =>
    ({
      nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
      headers: new Headers(cookie ? { cookie } : {}),
    }) as unknown as NextRequest;

  it("redirects /dashboard to /login when no session cookie", () => {
    const result = authGuard(makeRequest("http://localhost:3001/dashboard"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("lets requests through when a session cookie is present", () => {
    const request = makeRequest("http://localhost:3001/dashboard", `${SESSION_COOKIE}=abc`);
    expect(authGuard(request)).toBeNull();
  });

  it("ignores non-dashboard paths", () => {
    const request = makeRequest("http://localhost:3001/api/auth/sign-in/email");
    expect(authGuard(request)).toBeNull();
  });
});

describe("proxy (middleware)", () => {
  it("redirects /dashboard to /login when no session cookie", async () => {
    const request = {
      nextUrl: Object.assign(new URL("http://localhost:3001/dashboard"), {
        clone: () => new URL("http://localhost:3001/dashboard"),
      }),
      headers: new Headers(),
    } as unknown as NextRequest;
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });
});

describe("auth handler (toNextJsHandler)", () => {
  it("sets an httpOnly session cookie on sign-in", async () => {
    await signUp("erin@example.com");

    const response = await POST(signInRequest("erin@example.com"));
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE}=`);
    expect(setCookie).toContain("HttpOnly");
  });

  it("rejects a session with a forged cookie (page re-check would catch it)", async () => {
    await signUp("frank@example.com");
    await signInCookie("frank@example.com");

    const forged = await auth.api.getSession({
      headers: new Headers({ cookie: `${SESSION_COOKIE}=forged.invalid` }),
    });
    expect(forged).toBeNull();
  });
});
