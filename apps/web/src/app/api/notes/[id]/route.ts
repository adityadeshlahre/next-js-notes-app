import { db } from "@next-js-notes-app/db";
import { notes } from "@next-js-notes-app/db/schema/index";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  requireUser,
  isErrorResponse,
  jsonError,
  firstIssueMessage,
  parseJson,
} from "@/lib/api-helpers";
import { noteTagsByName, replaceNoteTags } from "@/lib/tags";
import { noteIdSchema, updateNoteSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function parseNoteId(raw: string): string | NextResponse {
  const parsed = noteIdSchema.safeParse({ id: raw });
  if (!parsed.success) return jsonError(400, "Invalid note id");
  return parsed.data.id;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const id = parseNoteId((await params).id);
  if (id instanceof NextResponse) return id;

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, auth.user.id)));

  if (!note) return jsonError(404, "Note not found");

  const tagsByNote = await noteTagsByName([note.id]);
  return NextResponse.json({ ...note, tags: tagsByNote.get(note.id) ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const id = parseNoteId((await params).id);
  if (id instanceof NextResponse) return id;

  const parsed = updateNoteSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return jsonError(400, firstIssueMessage(parsed.error));
  }
  const { tags: incomingTags, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0 && incomingTags === undefined) {
    return jsonError(400, "Nothing to update");
  }

  let note: typeof notes.$inferSelect | undefined;
  if (Object.keys(fields).length > 0) {
    [note] = await db
      .update(notes)
      .set(fields)
      .where(and(eq(notes.id, id), eq(notes.userId, auth.user.id)))
      .returning();
  } else {
    [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, auth.user.id)));
  }

  if (!note) return jsonError(404, "Note not found");

  if (incomingTags !== undefined) {
    await replaceNoteTags(note.id, auth.user.id, incomingTags);
  }

  const tagsByNote = await noteTagsByName([note.id]);
  return NextResponse.json({ ...note, tags: tagsByNote.get(note.id) ?? [] });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const id = parseNoteId((await params).id);
  if (id instanceof NextResponse) return id;

  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, auth.user.id)))
    .returning({ id: notes.id });

  if (!deleted) return jsonError(404, "Note not found");
  return NextResponse.json({ success: true });
}
