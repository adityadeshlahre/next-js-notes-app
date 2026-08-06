import { db } from "@next-js-notes-app/db";
import { notes } from "@next-js-notes-app/db/schema/index";
import { createAuth } from "@next-js-notes-app/auth";
import { eq } from "drizzle-orm";
import { describe, expect, it, beforeEach } from "vitest";

import { GET as listNotes, POST as createNote } from "@/app/api/notes/route";
import {
  GET as getNote,
  PATCH as updateNote,
  DELETE as deleteNote,
} from "@/app/api/notes/[id]/route";
import { POST as authPost } from "@/app/api/auth/[...all]/route";

import pg from "pg";

const { Client } = pg;

const PASSWORD = "password123";
const COOKIE = "better-auth.session_token";
const BASE = "http://localhost:3001";

const auth = createAuth();

const truncate = async () => {
  const admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`TRUNCATE "notes", "user", "session", "account", "verification" CASCADE`);
  await admin.end();
};

beforeEach(async () => {
  await truncate();
});

async function signUpCookie(email: string): Promise<string> {
  await auth.api.signUpEmail({
    body: { email, name: email.split("@")[0], password: PASSWORD },
  });
  const res = await authPost(
    new Request(`${BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD }),
    }),
  );
  const match = res.headers
    .get("set-cookie")
    ?.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/);
  expect(match).toBeTruthy();
  return match![1];
}

const headers = (token: string) => new Headers({ cookie: `${COOKIE}=${token}` });
const jsonHeaders = (token: string) =>
  new Headers({ cookie: `${COOKIE}=${token}`, "content-type": "application/json" });

async function createNoteFor(token: string, title: string, body = "") {
  const res = await createNote(
    new Request(`${BASE}/api/notes`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ title, body }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; title: string; body: string };
}

describe("notes CRUD", { sequential: true }, () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await listNotes(new Request(`${BASE}/api/notes`));
    expect(res.status).toBe(401);
  });

  it("creates a note and lists it for the owner", async () => {
    const token = await signUpCookie("alice@example.com");
    const created = await createNoteFor(token, "Groceries", "milk, eggs");

    const listRes = await listNotes(new Request(`${BASE}/api/notes`, { headers: headers(token) }));
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { id: string; title: string }[];
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].title).toBe("Groceries");

    const getRes = await getNote(
      new Request(`${BASE}/api/notes/${created.id}`, { headers: headers(token) }),
      {
        params: Promise.resolve({ id: created.id }),
      },
    );
    expect(getRes.status).toBe(200);
    expect(((await getRes.json()) as { body: string }).body).toBe("milk, eggs");
  });

  it("patches a note partially and persists the change", async () => {
    const token = await signUpCookie("bob@example.com");
    const created = await createNoteFor(token, "Title", "old body");

    const patchRes = await updateNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify({ title: "New Title" }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { title: string; body: string };
    expect(patched.title).toBe("New Title");
    expect(patched.body).toBe("old body");
  });

  it("deletes a note", async () => {
    const token = await signUpCookie("carol@example.com");
    const created = await createNoteFor(token, "Doomed");

    const delRes = await deleteNote(
      new Request(`${BASE}/api/notes/${created.id}`, { method: "DELETE", headers: headers(token) }),
      {
        params: Promise.resolve({ id: created.id }),
      },
    );
    expect(delRes.status).toBe(200);

    const getRes = await getNote(
      new Request(`${BASE}/api/notes/${created.id}`, { headers: headers(token) }),
      {
        params: Promise.resolve({ id: created.id }),
      },
    );
    expect(getRes.status).toBe(404);
  });

  it("returns 400 for invalid input", async () => {
    const token = await signUpCookie("dave@example.com");

    const res = await createNote(
      new Request(`${BASE}/api/notes`, {
        method: "POST",
        headers: jsonHeaders(token),
        body: JSON.stringify({ title: "   " }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBeTruthy();
  });

  it("returns 400 for malformed JSON instead of a 500", async () => {
    const token = await signUpCookie("eve@example.com");

    const res = await createNote(
      new Request(`${BASE}/api/notes`, {
        method: "POST",
        headers: jsonHeaders(token),
        body: "{not valid json",
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBeTruthy();
  });

  it("returns 404 when a user touches another user's note (no existence leak)", async () => {
    const tokenA = await signUpCookie("owner@example.com");
    const tokenB = await signUpCookie("intruder@example.com");
    const created = await createNoteFor(tokenA, "Private");

    const params = { params: Promise.resolve({ id: created.id }) };

    const getRes = await getNote(
      new Request(`${BASE}/api/notes/${created.id}`, { headers: headers(tokenB) }),
      params,
    );
    expect(getRes.status).toBe(404);

    const patchRes = await updateNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "PATCH",
        headers: jsonHeaders(tokenB),
        body: JSON.stringify({ title: "hacked" }),
      }),
      params,
    );
    expect(patchRes.status).toBe(404);

    const delRes = await deleteNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "DELETE",
        headers: headers(tokenB),
      }),
      params,
    );
    expect(delRes.status).toBe(404);

    const [stillThere] = await db.select().from(notes).where(eq(notes.id, created.id));
    expect(stillThere.title).toBe("Private");
  });

  it("returns 404 for a missing note id and 400 for an invalid one", async () => {
    const token = await signUpCookie("erin@example.com");

    const missing = await getNote(
      new Request(`${BASE}/api/notes/00000000-0000-0000-0000-000000000000`, {
        headers: headers(token),
      }),
      {
        params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
      },
    );
    expect(missing.status).toBe(404);

    const invalid = await getNote(
      new Request(`${BASE}/api/notes/not-a-uuid`, { headers: headers(token) }),
      {
        params: Promise.resolve({ id: "not-a-uuid" }),
      },
    );
    expect(invalid.status).toBe(400);
  });
});
