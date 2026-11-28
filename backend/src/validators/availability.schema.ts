import { z } from "zod";

const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const monthKey = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");

const timeKey = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm");

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/* -------------------------------- queries -------------------------------- */

export const publicDayQuery = z.object({
  date: dateKey.optional(),
  duration: z.coerce.number().int().min(5).max(600).optional(),
});

export const publicMonthQuery = z.object({
  month: monthKey.optional(),
  duration: z.coerce.number().int().min(5).max(600).optional(),
});

export const adminDayQuery = z.object({
  date: dateKey,
});

export const adminMonthQuery = z.object({
  month: monthKey,
});

export const overrideDateQuery = z.object({
  date: dateKey,
});

/* ------------------------------- settings -------------------------------- */

export const scheduleSchema = z
  .object({
    openTime: timeKey,
    closeTime: timeKey,
    stepMinutes: z.coerce.number().int().min(5).max(240),
    openWeekdays: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, "Keep at least one day open")
      .max(7),
    horizonDays: z.coerce.number().int().min(1).max(730),
  })
  .refine((value) => toMinutes(value.openTime) < toMinutes(value.closeTime), {
    message: "Closing time must be after opening time",
    path: ["closeTime"],
  });

/* ----------------------------- day override ------------------------------ */

export const dayOverrideSchema = z
  .object({
    isClosed: z.boolean().default(false),
    openTime: timeKey.optional(),
    closeTime: timeKey.optional(),
    stepMinutes: z.coerce.number().int().min(5).max(240).optional(),
    note: z.string().trim().max(300).optional(),
  })
  .refine(
    (value) =>
      (!value.openTime && !value.closeTime) ||
      (Boolean(value.openTime) && Boolean(value.closeTime)),
    {
      message: "Set both opening and closing time, or leave both blank",
      path: ["closeTime"],
    }
  )
  .refine(
    (value) =>
      !value.openTime ||
      !value.closeTime ||
      toMinutes(value.openTime) < toMinutes(value.closeTime),
    {
      message: "Closing time must be after opening time",
      path: ["closeTime"],
    }
  );

/* ------------------------------- time block ------------------------------ */

export const createBlockSchema = z
  .object({
    date: dateKey,
    startTime: timeKey,
    endTime: timeKey,
    note: z.string().trim().max(300).optional(),
  })
  .refine((value) => toMinutes(value.startTime) < toMinutes(value.endTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const blockIdParam = z.object({
  id: z.string().trim().min(1, "Block id is required"),
});

export type PublicDayQuery = z.infer<typeof publicDayQuery>;
export type PublicMonthQuery = z.infer<typeof publicMonthQuery>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type DayOverrideInput = z.infer<typeof dayOverrideSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
