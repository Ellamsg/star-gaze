import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single dashes (e.g. gel-manicure)"
  )
  .max(80);

/**
 * Accepts a real boolean (JSON body) or "true"/"false" (query string).
 * NOTE: z.coerce.boolean() is wrong here — Boolean("false") === true.
 */
const booleanFlag = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => (typeof value === "boolean" ? value : value === "true"));

export const serviceIdParam = z.object({
  id: z.string().trim().min(1, "Service id or slug is required"),
});

export const createServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  slug: slugSchema.optional(),
  durationMin: z.coerce
    .number()
    .int("Duration must be a whole number of minutes")
    .min(5, "Duration must be at least 5 minutes")
    .max(600, "Duration must be at most 600 minutes"),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price is too large"),
  active: booleanFlag.optional(),
  categoryId: z.string().trim().min(1, "Category id is required").nullable().optional(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
});

/**
 * PUT takes a partial payload so you can flip `active` without resending the
 * whole service, but at least one field must be present.
 */
export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one field to update",
  });

export const listServicesQuery = z.object({
  active: booleanFlag.optional(),
  categoryId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(100).optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuery>;