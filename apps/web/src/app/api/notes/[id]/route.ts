import { db } from "@next-js-notes-app/db";
import { notes } from "@next-js-notes-app/db/schema/index";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireUser, isErrorResponse, jsonError } from "@/lib/api-helpers";
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
  return NextResponse.json(note);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const id = parseNoteId((await params).id);
  if (id instanceof NextResponse) return id;

  const parsed = updateNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  if (Object.keys(parsed.data).length === 0) {
    return jsonError(400, "Nothing to update");
  }

  const [note] = await db
    .update(notes)
    .set(parsed.data)
    .where(and(eq(notes.id, id), eq(notes.userId, auth.user.id)))
    .returning();

  if (!note) return jsonError(404, "Note not found");
  return NextResponse.json(note);
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
