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

describe("notes filters", { sequential: true }, () => {
  async function seedNotes(
    token: string,
    notesIn: { title: string; body?: string; tags?: string[] }[],
  ) {
    const created = [];
    for (const n of notesIn) {
      const res = await createNote(
        new Request(`${BASE}/api/notes`, {
          method: "POST",
          headers: jsonHeaders(token),
          body: JSON.stringify(n),
        }),
      );
      expect(res.status).toBe(201);
      created.push((await res.json()) as { id: string; title: string });
    }
    return created;
  }

  it("searches by title case-insensitively, not the body", async () => {
    const token = await signUpCookie("fanny@example.com");
    await seedNotes(token, [
      { title: "Shopping list", body: "milk" },
      { title: "Groceries", body: "needle in haystack" },
    ]);

    const res = await listNotes(
      new Request(`${BASE}/api/notes?q=shopping`, { headers: headers(token) }),
    );
    expect(res.status).toBe(200);
    const list = (await res.json()) as { title: string }[];
    expect(list.map((n) => n.title)).toEqual(["Shopping list"]);

    const resBody = await listNotes(
      new Request(`${BASE}/api/notes?q=needle`, { headers: headers(token) }),
    );
    const listBody = (await resBody.json()) as { title: string }[];
    expect(listBody).toEqual([]);
  });

  it("filters by multiple tags with AND semantics", async () => {
    const token = await signUpCookie("gina@example.com");
    await seedNotes(token, [
      { title: "note-a", tags: ["work", "important"] },
      { title: "note-b", tags: ["work"] },
      { title: "note-c", tags: ["important"] },
      { title: "note-d" },
    ]);

    const res = await listNotes(
      new Request(`${BASE}/api/notes?tags=work,important`, { headers: headers(token) }),
    );
    expect(res.status).toBe(200);
    const list = (await res.json()) as { title: string }[];
    expect(list.map((n) => n.title)).toEqual(["note-a"]);
  });

  it("sorts by createdAt asc and desc", async () => {
    const token = await signUpCookie("hank@example.com");
    const created = await seedNotes(token, [{ title: "older" }, { title: "newer" }]);
    const [older, newer] = created;
    await db
      .update(notes)
      .set({ createdAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(notes.id, older.id));
    await db
      .update(notes)
      .set({ createdAt: new Date("2026-06-01T00:00:00Z") })
      .where(eq(notes.id, newer.id));

    const ascRes = await listNotes(
      new Request(`${BASE}/api/notes?sort=createdAt&dir=asc`, { headers: headers(token) }),
    );
    const ascList = (await ascRes.json()) as { title: string }[];
    expect(ascList.map((n) => n.title)).toEqual(["older", "newer"]);

    const descRes = await listNotes(
      new Request(`${BASE}/api/notes?sort=createdAt&dir=desc`, { headers: headers(token) }),
    );
    const descList = (await descRes.json()) as { title: string }[];
    expect(descList.map((n) => n.title)).toEqual(["newer", "older"]);
  });

  it("combines q, tags, and dir in one query", async () => {
    const token = await signUpCookie("ines@example.com");
    const seeded = await seedNotes(token, [
      { title: "Meeting notes", tags: ["work", "red"] },
      { title: "Meeting ideas", tags: ["work"] },
      { title: "Personal diary", tags: ["red"] },
    ]);
    await db
      .update(notes)
      .set({ createdAt: new Date("2026-02-01T00:00:00Z") })
      .where(eq(notes.id, seeded[1].id));
    await db
      .update(notes)
      .set({ createdAt: new Date("2026-03-01T00:00:00Z") })
      .where(eq(notes.id, seeded[0].id));

    const res = await listNotes(
      new Request(`${BASE}/api/notes?q=meeting&tags=work&dir=asc`, { headers: headers(token) }),
    );
    expect(res.status).toBe(200);
    const list = (await res.json()) as { title: string }[];
    expect(list.map((n) => n.title)).toEqual(["Meeting ideas", "Meeting notes"]);
  });

  it("treats LIKE wildcards in search input literally", async () => {
    const token = await signUpCookie("karl@example.com");
    await seedNotes(token, [
      { title: "grow 100% bigger" },
      { title: "grow 100 times bigger" },
      { title: "under_score note" },
    ]);

    const percentRes = await listNotes(
      new Request(`${BASE}/api/notes?q=100%25`, { headers: headers(token) }),
    );
    const percentList = (await percentRes.json()) as { title: string }[];
    expect(percentList.map((n) => n.title)).toEqual(["grow 100% bigger"]);

    const underscoreRes = await listNotes(
      new Request(`${BASE}/api/notes?q=under_score`, { headers: headers(token) }),
    );
    const underscoreList = (await underscoreRes.json()) as { title: string }[];
    expect(underscoreList.map((n) => n.title)).toEqual(["under_score note"]);
  });

  it("ignores whitespace-only search input", async () => {
    const token = await signUpCookie("lana@example.com");
    await seedNotes(token, [{ title: "alpha" }, { title: "beta" }]);

    const res = await listNotes(
      new Request(`${BASE}/api/notes?q=%20%20`, { headers: headers(token) }),
    );
    expect(res.status).toBe(200);
    const list = (await res.json()) as { title: string }[];
    expect(list).toHaveLength(2);
  });

  it("returns 400 for an invalid sort direction", async () => {
    const token = await signUpCookie("jack@example.com");

    const res = await listNotes(
      new Request(`${BASE}/api/notes?dir=sideways`, { headers: headers(token) }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { message: string }).message).toBeTruthy();
  });
});
