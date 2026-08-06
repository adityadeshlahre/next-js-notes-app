import { db } from "@next-js-notes-app/db";
import { notes } from "@next-js-notes-app/db/schema/index";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  requireUser,
  isErrorResponse,
  jsonError,
  firstIssueMessage,
  parseJson,
} from "@/lib/api-helpers";
import { createNoteSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, auth.user.id))
    .orderBy(desc(notes.createdAt));

  return NextResponse.json(userNotes);
}

export async function POST(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const parsed = createNoteSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return jsonError(400, firstIssueMessage(parsed.error));
  }

  const [note] = await db
    .insert(notes)
    .values({ userId: auth.user.id, title: parsed.data.title, body: parsed.data.body })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
