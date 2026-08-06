import { db } from "@next-js-notes-app/db";
import { noteTags, notes } from "@next-js-notes-app/db/schema/index";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  requireUser,
  isErrorResponse,
  jsonError,
  firstIssueMessage,
  parseJson,
} from "@/lib/api-helpers";
import { noteTagsByName, upsertTags } from "@/lib/tags";
import { createNoteSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, auth.user.id))
    .orderBy(desc(notes.createdAt));

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
