import { z } from "zod";

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const timeKey = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm");

export const slotIdParam = z.object({
  id: z.string().trim().min(1, "Slot id is required"),
});

export const listSlotsQuery = z.object({
  from: dateKey.optional(),
  to: dateKey.optional(),
  status: z.enum(["OPEN", "BOOKED", "BLOCKED"]).optional(),
  minDuration: z.coerce.number().int().min(5).max(600).optional(),
});

export const createSlotsSchema = z.object({
  slots: z
    .array(
      z.object({
        date: dateKey,
        time: timeKey,
        durationMin: z.coerce.number().int().min(5).max(600).optional(),
      })
    )
    .min(1, "Add at least one slot")
    .max(200, "Add at most 200 slots at a time"),
  // Default length used when a slot doesn't carry its own durationMin.
  durationMin: z.coerce.number().int().min(5).max(600).default(60),
  note: z.string().trim().max(300).optional(),
  staffId: z.string().trim().min(1).optional(),
});

export const updateSlotSchema = z.object({
  status: z.enum(["OPEN", "BLOCKED"]),
});

export const cancelDaySchema = z.object({
  date: dateKey,
});

export type ListSlotsQuery = z.infer<typeof listSlotsQuery>;
export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
