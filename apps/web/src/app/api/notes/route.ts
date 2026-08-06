import { db } from "@next-js-notes-app/db";
import { notes, noteTags, tags } from "@next-js-notes-app/db/schema/index";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  requireUser,
  isErrorResponse,
  jsonError,
  firstIssueMessage,
  parseJson,
} from "@/lib/api-helpers";
import { noteTagsByName, upsertTags } from "@/lib/tags";
import { createNoteSchema, listNotesQuerySchema } from "@/lib/validation";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function GET(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const parsed = listNotesQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return jsonError(400, firstIssueMessage(parsed.error));
  }

  const { q, tags: tagsParam, dir } = parsed.data;

  const conditions = [eq(notes.userId, auth.user.id)];
  if (q) {
    conditions.push(ilike(notes.title, `%${escapeLike(q)}%`));
  }

  const filterTags = tagsParam
    ? [
        ...new Set(
          tagsParam
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        ),
      ]
    : [];
  if (filterTags.length > 0) {
    const matching = db
      .select({ noteId: noteTags.noteId })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(and(eq(tags.userId, auth.user.id), inArray(tags.name, filterTags)))
      .groupBy(noteTags.noteId)
      .having(sql`count(${noteTags.tagId}) = ${filterTags.length}`);
    conditions.push(inArray(notes.id, matching));
  }

  const userNotes = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(dir === "asc" ? asc(notes.createdAt) : desc(notes.createdAt));

  const tagsByNote = await noteTagsByName(userNotes.map((note) => note.id));

  return NextResponse.json(
    userNotes.map((note) => ({ ...note, tags: tagsByNote.get(note.id) ?? [] })),
  );
}

export async function POST(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const parsed = createNoteSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return jsonError(400, firstIssueMessage(parsed.error));
  }

  const tagIds = await upsertTags(auth.user.id, parsed.data.tags);
  const [note] = await db
    .insert(notes)
    .values({ userId: auth.user.id, title: parsed.data.title, body: parsed.data.body })
    .returning();

  if (tagIds.length > 0) {
    await db.insert(noteTags).values(tagIds.map((tagId) => ({ noteId: note.id, tagId })));
  }

  const tagsByNote = await noteTagsByName([note.id]);
  return NextResponse.json({ ...note, tags: tagsByNote.get(note.id) ?? [] }, { status: 201 });
}
