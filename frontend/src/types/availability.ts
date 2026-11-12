export type SlotStatus = "OPEN" | "BOOKED" | "BLOCKED";

/** Shape returned by GET /api/availability and GET /api/availability/all */
export type AvailabilitySlotDTO = {
  id: string;
  date: string; // "2026-11-02"
  time: string; // "13:00"
  endTime: string; // "14:00"
  startAt: string; // ISO
  endAt: string; // ISO
  durationMin: number;
  status: SlotStatus;
  note: string | null;
  appointmentId: string | null;
};

/** Body sent to POST /api/availability */
export type CreateSlotsPayload = {
  slots: Array<{ date: string; time: string; durationMin?: number }>;
  durationMin?: number;
  note?: string;
  staffId?: string;
};

/** Response from POST /api/availability */
export type CreateSlotsResult = {
  created: number;
  skipped: number;
};

/** Response from POST /api/availability/cancel-day */
export type CancelDayResult = {
  date: string;
  closed: number;
  bookedLeftAlone: number;
};

/** React Hook Form values — "Add times" form */
export type AddSlotsFormValues = {
  date: string;
  times: string;
  duration: string;
};

/** React Hook Form values — date range filter */
export type AvailabilityFilterValues = {
  from: string;
  to: string;
};
