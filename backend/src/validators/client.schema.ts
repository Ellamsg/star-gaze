import { z } from "zod";

export const clientIdParam = z.object({
  id: z.string().trim().min(1, "Client id is required"),
});

/** Admin note editing. Empty string is stored as null. */
export const updateClientSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be at most 2000 characters")
    .nullable(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
