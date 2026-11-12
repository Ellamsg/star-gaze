/** Lifecycle statuses used by the admin UI. */
export const appointmentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

/** Status values exactly as the API/Prisma returns them. */
export const appointmentApiStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentApiStatus = (typeof appointmentApiStatuses)[number];

export const appointmentStatusToApi: Record<
  AppointmentStatus,
  AppointmentApiStatus
> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  no_show: "NO_SHOW",
};

export const appointmentStatusFromApi: Record<
  AppointmentApiStatus,
  AppointmentStatus
> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

/** Shape returned by POST /api/appointments */
export type AppointmentDTO = {
  id: string;
  reference: string;
  manageToken: string;
  status: string;
  startAt: string;
  endAt: string;
  price: number;
  services: Array<{ id: string; name: string }>;
};

/** Body sent to POST /api/appointments */
export type CreateAppointmentPayload = {
  slotId: string;
  serviceIds: string[];
  name: string;
  phone: string;
  email?: string;
  note?: string;
};

/** React Hook Form values — guest details step */
export type GuestFormValues = {
  name: string;
  phone: string;
  note: string;
};

/** Row returned by GET /api/appointments (admin only — no manageToken). */
export type AdminAppointmentDTO = {
  id: string;
  reference: string;
  status: AppointmentApiStatus;
  startAt: string;
  endAt: string;
  price: number;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  staff: { id: string; name: string } | null;
  slot: { id: string; startAt: string; endAt: string } | null;
  items: Array<{
    id: string;
    price: number;
    durationMin: number;
    service: { id: string; name: string };
  }>;
  photos: Array<{ id: string; url: string }>;
};

/** Body sent to PATCH /api/appointments/:id/status */
export type UpdateAppointmentStatusPayload = {
  status: AppointmentApiStatus;
};

/** Appointment plus the derived fields the admin list renders. */
export type AppointmentAdminRow = AdminAppointmentDTO & {
  date: string;
  time: string;
  statusUi: AppointmentStatus;
  clientName: string;
  serviceNames: string;
  totalDurationMin: number;
  photo?: string;
};

export type AppointmentStatusFilter = "all" | AppointmentStatus;
