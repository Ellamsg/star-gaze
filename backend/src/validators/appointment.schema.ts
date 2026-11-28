import { z } from "zod";

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const timeKey = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm");

export const appointmentIdParam = z.object({
  id: z.string().trim().min(1),
});

export const createAppointmentSchema = z
  .object({
    // Legacy path: an explicit slot row. New bookings send date + time.
    slotId: z.string().trim().min(1).optional(),
    date: dateKey.optional(),
    time: timeKey.optional(),
    serviceIds: z
      .array(z.string().trim().min(1))
      .min(1, "Pick at least one service")
      .max(10),
    name: z.string().trim().min(2, "Name is too short").max(120),
    phone: z.string().trim().min(7, "Phone is too short").max(20),
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    note: z.string().trim().max(1000).optional(),
    photoIds: z.array(z.string().min(1).max(200)).max(3).optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.slotId) return;
    if (!value.date || !value.time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time"],
        message: "Pick a date and a time",
      });
    }
  });

export const cancelByTokenSchema = z.object({
  token: z.string().trim().min(10),
});

export const appointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

/** Admin: change the lifecycle status without deleting the booking. */
export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
