import type {
  AppointmentApiStatus,
  AppointmentStatus,
} from "./appointment";

/** One booking in a client's history, as returned by GET /api/clients. */
export type ClientAppointmentDTO = {
  id: string;
  reference: string;
  status: AppointmentApiStatus;
  startAt: string;
  endAt: string;
  price: number;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    price: number;
    durationMin: number;
    service: { id: string; name: string };
  }>;
};

/** Shape returned by GET /api/clients. */
export type AdminClientDTO = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  marketingOptIn: boolean;
  lastVisitAt: string | null;
  createdAt: string;
  appointments: ClientAppointmentDTO[];
};

/** Body sent to PATCH /api/clients/:id */
export type UpdateClientPayload = {
  notes: string | null;
};

/** react-hook-form values for the private-note editor. */
export type ClientNotesFormValues = {
  notes: string;
};

/** Appointment plus the derived values the client history renders. */
export type ClientAppointmentRow = ClientAppointmentDTO & {
  date: string;
  time: string;
  statusUi: AppointmentStatus;
  serviceNames: string;
  totalDurationMin: number;
};

/** Client plus the stats shown in the list and detail sheet. */
export type ClientAdminRow = AdminClientDTO & {
  name: string;
  visits: number;
  spend: number;
  lastVisit: string | null;
  upcoming: number;
  history: ClientAppointmentRow[];
};
