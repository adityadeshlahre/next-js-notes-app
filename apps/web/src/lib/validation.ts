import { z } from "zod";

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag is too long");

export const tagsSchema = z.array(tagNameSchema).max(20, "Too many tags");

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(10000).default(""),
  tags: tagsSchema.default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  body: z.string().max(10000).optional(),
  tags: tagsSchema.optional(),
});

export const noteIdSchema = z.object({
  id: z.uuid("Invalid note id"),
});

export const listNotesQuerySchema = z.object({
  q: z.string().max(200, "Search is too long").optional(),
  tags: z.string().max(500).optional(),
  sort: z.literal("createdAt").default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
