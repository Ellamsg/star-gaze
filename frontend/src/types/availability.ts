/** Why a date has no times in the booking calendar. */
export type DayReason = "open" | "closed" | "weekday" | "past" | "beyond";

/** One open start time calculated from the timetable. */
export type OpenTimeDTO = {
  time: string; // "09:00"
  endTime: string; // "10:30" (start + chosen duration)
  startAt: string; // ISO instant
  endAt: string; // ISO instant
  past: boolean; // admin sees these dimmed
};

/** A real appointment occupying a time on the admin day view. */
export type BookedAppointmentDTO = {
  id: string;
  reference: string;
  status: string;
  startAt: string;
  endAt: string;
  time: string;
  endTime: string;
  price: number;
  clientName: string;
  serviceNames: string;
};

/** A closed window inside one date. */
export type ScheduleBlockDTO = {
  id: string;
  startTime: string;
  endTime: string;
  note: string | null;
};

export type DayOverrideDTO = {
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  stepMinutes: number | null;
  note: string | null;
};

/** GET /api/availability — public day */
export type PublicDayDTO = {
  date: string;
  isOpen: boolean;
  reason: DayReason;
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  note: string | null;
  blocks: ScheduleBlockDTO[];
  times: OpenTimeDTO[];
};

export type MonthDayStatus = "open" | "full" | "closed" | "past";

/** One cell in the month calendar. */
export type MonthDayDTO = {
  date: string;
  status: MonthDayStatus;
  availableCount: number;
  bookedCount: number;
  isClosed: boolean;
};

export type ScheduleSettingsDTO = {
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  openWeekdays: number[];
  horizonDays: number;
};

/** GET /api/availability/month and /api/availability/admin/month */
export type AvailabilityMonthDTO = {
  month: string; // "2026-12"
  days: MonthDayDTO[];
  settings: ScheduleSettingsDTO;
};

/** GET /api/availability/admin/day */
export type AdminDayDTO = {
  date: string;
  isOpen: boolean;
  reason: DayReason;
  source: "default" | "override";
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  override: DayOverrideDTO | null;
  blocks: ScheduleBlockDTO[];
  note: string | null;
  times: OpenTimeDTO[];
  booked: BookedAppointmentDTO[];
};

/* --------------------------------- forms --------------------------------- */

export type ScheduleFormValues = {
  openTime: string;
  closeTime: string;
  stepMinutes: string;
  openWeekdays: number[];
  horizonDays: string;
};

export type DaySettingsFormValues = {
  openTime: string;
  closeTime: string;
  stepMinutes: string;
  note: string;
};

export type BlockFormValues = {
  startTime: string;
  endTime: string;
  note: string;
};

/* -------------------------------- payloads ------------------------------- */

export type UpdateSchedulePayload = {
  openTime: string;
  closeTime: string;
  stepMinutes: number;
  openWeekdays: number[];
  horizonDays: number;
};

export type DayOverridePayload = {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  stepMinutes?: number;
  note?: string;
};

export type CreateBlockPayload = {
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
};
