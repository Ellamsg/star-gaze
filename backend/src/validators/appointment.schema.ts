import { z } from "zod";

export const appointmentIdParam = z.object({
  id: z.string().trim().min(1),
});

export const createAppointmentSchema = z.object({
  slotId: z.string().trim().min(1, "Pick a time slot"),
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
