import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(10000).default(""),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  body: z.string().max(10000).optional(),
});

export const noteIdSchema = z.object({
  id: z.uuid("Invalid note id"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
