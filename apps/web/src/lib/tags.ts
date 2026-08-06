import { db } from "@next-js-notes-app/db";
import { noteTags, tags } from "@next-js-notes-app/db/schema/index";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, asc, eq, inArray } from "drizzle-orm";

type DbClient = Pick<NodePgDatabase, "insert" | "select">;

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

async function upsertTagsWith(
  client: DbClient,
  userId: string,
  names: string[],
): Promise<string[]> {
  const normalized = [...new Set(names.map(normalizeTagName))];
  if (normalized.length === 0) return [];

  await client
    .insert(tags)
    .values(normalized.map((name) => ({ userId, name })))
    .onConflictDoNothing();

  const rows = await client
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, normalized)));

  return rows.map((row) => row.id);
}

export async function upsertTags(userId: string, names: string[]): Promise<string[]> {
  return upsertTagsWith(db, userId, names);
}

export async function replaceNoteTags(
  noteId: string,
  userId: string,
  names: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const tagIds = await upsertTagsWith(tx, userId, names);
    await tx.delete(noteTags).where(eq(noteTags.noteId, noteId));
    if (tagIds.length > 0) {
      await tx.insert(noteTags).values(tagIds.map((tagId) => ({ noteId, tagId })));
    }
  });
}

export async function noteTagsByName(noteIds: string[]): Promise<Map<string, string[]>> {
  if (noteIds.length === 0) return new Map();

  const rows = await db
    .select({ noteId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(inArray(noteTags.noteId, noteIds))
    .orderBy(asc(tags.name));

  const byNote = new Map<string, string[]>();
  for (const row of rows) {
    const list = byNote.get(row.noteId) ?? [];
    list.push(row.name);
    byNote.set(row.noteId, list);
  }
  return byNote;
}
