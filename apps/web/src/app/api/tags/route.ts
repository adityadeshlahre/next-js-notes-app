import { db } from "@next-js-notes-app/db";
import { tags } from "@next-js-notes-app/db/schema/index";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireUser, isErrorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const auth = await requireUser(request.headers);
  if (isErrorResponse(auth)) return auth;

  const userTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.userId, auth.user.id))
    .orderBy(asc(tags.name));

  return NextResponse.json(userTags);
}
