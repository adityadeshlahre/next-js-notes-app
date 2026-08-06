import { createAuth } from "@next-js-notes-app/auth";
import { db } from "@next-js-notes-app/db";
import { tags } from "@next-js-notes-app/db/schema/index";
import { describe, expect, it, beforeEach } from "vitest";

import { GET as listNotes, POST as createNote } from "@/app/api/notes/route";
import { PATCH as updateNote } from "@/app/api/notes/[id]/route";
import { GET as listTags } from "@/app/api/tags/route";
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
  await admin.query(
    `TRUNCATE "note_tags", "tags", "notes", "user", "session", "account", "verification" CASCADE`,
  );
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

async function createNoteWithTags(token: string, title: string, tags: string[]) {
  const res = await createNote(
    new Request(`${BASE}/api/notes`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ title, tags }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; title: string; tags: string[] };
}

describe("tags", { sequential: true }, () => {
  it("auto-creates tags on note creation, normalized and deduplicated", async () => {
    const token = await signUpCookie("taggy@example.com");
    await createNoteWithTags(token, "Groceries", ["Work", "  Work ", "work"]);

    const tagRows = await db.select({ name: tags.name }).from(tags);
    expect(tagRows).toEqual([{ name: "work" }]);
  });

  it("lists a note with its assigned tags", async () => {
    const token = await signUpCookie("listy@example.com");
    await createNoteWithTags(token, "Groceries", ["Shopping", "Errands"]);

    const res = await listNotes(new Request(`${BASE}/api/notes`, { headers: headers(token) }));
    expect(res.status).toBe(200);
    const notes = (await res.json()) as { title: string; tags: string[] }[];
    expect(notes[0].tags).toEqual(["errands", "shopping"]);
  });

  it("replaces tags wholesale on PATCH, detaching removed ones", async () => {
    const token = await signUpCookie("patchy@example.com");
    const created = await createNoteWithTags(token, "Groceries", ["Shopping", "Errands"]);

    const res = await updateNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify({ tags: ["Shopping", "Urgent"] }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(res.status).toBe(200);
    const patched = (await res.json()) as { tags: string[] };
    expect(patched.tags).toEqual(["shopping", "urgent"]);

    const listRes = await listNotes(new Request(`${BASE}/api/notes`, { headers: headers(token) }));
    const [note] = (await listRes.json()) as { tags: string[] }[];
    expect(note.tags).toEqual(["shopping", "urgent"]);
  });

  it("clears all tags when PATCHed with an empty list", async () => {
    const token = await signUpCookie("clearer@example.com");
    const created = await createNoteWithTags(token, "Groceries", ["Shopping"]);

    const res = await updateNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "PATCH",
        headers: jsonHeaders(token),
        body: JSON.stringify({ tags: [] }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { tags: string[] }).tags).toEqual([]);
  });

  it("keeps tags private per user", async () => {
    const tokenA = await signUpCookie("owner@example.com");
    const tokenB = await signUpCookie("other@example.com");
    await createNoteWithTags(tokenA, "Secret", ["PrivateTag"]);

    const resB = await listTags(new Request(`${BASE}/api/tags`, { headers: headers(tokenB) }));
    expect(resB.status).toBe(200);
    expect((await resB.json()) as unknown[]).toEqual([]);

    const resA = await listTags(new Request(`${BASE}/api/tags`, { headers: headers(tokenA) }));
    const tagsA = (await resA.json()) as { name: string }[];
    expect(tagsA.map((t) => t.name)).toEqual(["privatetag"]);
  });

  it("lists normalized existing tags for autocomplete", async () => {
    const token = await signUpCookie("completer@example.com");
    await createNoteWithTags(token, "Groceries", ["Work", "Personal"]);

    const res = await listTags(new Request(`${BASE}/api/tags`, { headers: headers(token) }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string }[];
    expect(body.map((t) => t.name)).toEqual(["personal", "work"]);
  });

  it("does not let another user change tags via a tags-only PATCH", async () => {
    const tokenA = await signUpCookie("owner2@example.com");
    const tokenB = await signUpCookie("intruder2@example.com");
    const created = await createNoteWithTags(tokenA, "Secret", ["PrivateTag"]);

    const res = await updateNote(
      new Request(`${BASE}/api/notes/${created.id}`, {
        method: "PATCH",
        headers: jsonHeaders(tokenB),
        body: JSON.stringify({ tags: ["Hacked"] }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    expect(res.status).toBe(404);

    const listRes = await listNotes(new Request(`${BASE}/api/notes`, { headers: headers(tokenA) }));
    const [note] = (await listRes.json()) as { tags: string[] }[];
    expect(note.tags).toEqual(["privatetag"]);
  });
});
