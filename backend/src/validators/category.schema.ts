import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single dashes (e.g. nails)"
  )
  .max(80);

/** Accepts a real boolean (JSON body) or "true"/"false" (query string). */
const booleanFlag = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

export const categoryIdParam = z.object({
  id: z.string().trim().min(1, "Category id or slug is required"),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
  slug: slugSchema.optional(),
  sortOrder: z.coerce
    .number()
    .int("Sort order must be a whole number")
    .min(0, "Sort order cannot be negative")
    .max(9999, "Sort order is too large")
    .optional(),
  active: booleanFlag.optional(),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update",
  });

export const listCategoriesQuery = z.object({
  active: booleanFlag.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuery>;
