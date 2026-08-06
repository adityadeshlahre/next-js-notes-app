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
