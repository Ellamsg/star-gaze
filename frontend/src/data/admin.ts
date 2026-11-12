/**
 * Admin dashboard types + demo data.
 *
 * Everything here is shaped like the Prisma models in `backend/prisma`, so the
 * screens can swap this file for `fetch("/api/...")` without redesigning the UI.
 * Dates are local date keys ("2026-10-28"), times are 24h strings ("14:30").
 */

import { studio } from "./site";
import { dayKey } from "@/lib/date";
import {
  appointmentStatusLabels,
  appointmentStatuses,
  type AppointmentStatus,
} from "@/types/appointment";

// Re-exported so existing admin screens can keep importing from "@/data/admin".
export { appointmentStatusLabels, appointmentStatuses };
export type { AppointmentStatus };

/* ---------------------------------- types --------------------------------- */

export type ServiceTone = "blush" | "lilac" | "cherry" | "clay" | "sage" | "ink";

export type Service = {
  id: string;
  name: string;
  category: "Nails" | "Lashes";
  durationMin: number;
  price: number;
  description: string;
  active: boolean;
  tone: ServiceTone;
  /** Compressed data URL once the admin uploads a photo. */
  photo?: string;
};

export type Appointment = {
  id: string;
  reference: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: number;
  notes?: string;
  /** What the client sent as inspiration. */
  photo?: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  joinedAt: string;
};

export const roles = ["owner", "manager", "stylist", "front_desk"] as const;
export type Role = (typeof roles)[number];

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  /** ISO date the invite was accepted, or undefined while pending. */
  joinedAt?: string;
};

export const paymentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "refunded",
  "failed",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentMethod = "transfer" | "card" | "cash" | "pos";

export type Payment = {
  id: string;
  appointmentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Local date key of the appointment — what the filters group by. */
  date: string;
  paidAt?: string;
};

export const refundStatuses = ["requested", "approved", "paid", "declined"] as const;
export type RefundStatus = (typeof refundStatuses)[number];

export type Refund = {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedAt: string;
};

export type StudioProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  instagram: string;
};

export type NotificationPrefs = {
  newBookingEmail: boolean;
  reminderSms: boolean;
  refundAlerts: boolean;
  dailySummary: boolean;
};

export type AdminState = {
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  staff: Staff[];
  payments: Payment[];
  refunds: Refund[];
  studio: StudioProfile;
  notifications: NotificationPrefs;
};

/* --------------------------------- labels --------------------------------- */

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  refunded: "Refunded",
  failed: "Failed",
};

export const refundStatusLabels: Record<RefundStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  paid: "Paid out",
  declined: "Declined",
};

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  stylist: "Nail artist",
  front_desk: "Front desk",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  transfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  pos: "POS",
};

/* --------------------------------- helpers -------------------------------- */

const tonePairs: Record<ServiceTone, [string, string]> = {
  blush: ["#f7d7e2", "#c9778f"],
  lilac: ["#ded5f2", "#8a6fbd"],
  cherry: ["#f3c3c9", "#a12a3b"],
  clay: ["#efdfcf", "#a9805f"],
  sage: ["#dfe4d6", "#7f8a6d"],
  ink: ["#6c5b61", "#2a2226"],
};

/** Seed "inspiration" photos, drawn locally so nothing depends on a CDN. */
export function inspirationPhoto(tone: ServiceTone, label: string): string {
  const [from, to] = tonePairs[tone];
  const nails = [
    { x: 96, y: 150, h: 170 },
    { x: 196, y: 118, h: 210 },
    { x: 296, y: 108, h: 220 },
    { x: 396, y: 126, h: 200 },
    { x: 496, y: 160, h: 165 },
  ]
    .map(
      (n) =>
        `<rect x="${n.x}" y="${n.y}" width="52" height="${n.h}" rx="26" fill="white" fill-opacity="0.34"/><rect x="${n.x + 14}" y="${n.y + 16}" width="10" height="${n.h - 60}" rx="5" fill="white" fill-opacity="0.25"/>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><circle cx="320" cy="210" r="190" fill="white" fill-opacity="0.06"/>${nails}<text x="320" y="438" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-style="italic" fill="white" fill-opacity="0.9">${label}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const services: Service[] = [
  {
    id: "s1",
    name: "Gel manicure",
    category: "Nails",
    durationMin: 60,
    price: 12000,
    description: "Shaped, buffed and finished with a high-gloss gel that lasts.",
    active: true,
    tone: "blush",
  },
  {
    id: "s2",
    name: "Acrylic full set",
    category: "Nails",
    durationMin: 90,
    price: 20000,
    description: "Hand-sculpted extensions in your shape and colour of choice.",
    active: true,
    tone: "lilac",
  },
  {
    id: "s3",
    name: "Nail art add-on",
    category: "Nails",
    durationMin: 30,
    price: 5000,
    description: "Freehand linework, chrome or micro-French. Add to any set.",
    active: true,
    tone: "cherry",
  },
  {
    id: "s4",
    name: "Classic lash set",
    category: "Lashes",
    durationMin: 90,
    price: 18000,
    description: "One extension per lash for a clean, mascara-style finish.",
    active: true,
    tone: "clay",
  },
  {
    id: "s5",
    name: "Volume lash set",
    category: "Lashes",
    durationMin: 120,
    price: 25000,
    description: "Hand-fanned 3D–5D lashes for a full, fluffy lash line.",
    active: true,
    tone: "sage",
  },
  {
    id: "s6",
    name: "Lash refill",
    category: "Lashes",
    durationMin: 60,
    price: 12000,
    description: "A top-up for sets that need a refresh after two to three weeks.",
    active: true,
    tone: "ink",
  },
  {
    id: "s7",
    name: "Gel removal",
    category: "Nails",
    durationMin: 20,
    price: 3000,
    description: "Gentle soak-off and nail prep. Free with a new set.",
    active: false,
    tone: "clay",
  },
];

export const staff: Staff[] = [
  {
    id: "st1",
    name: "Amaka Nwankwo",
    email: "amaka@petalandlash.studio",
    phone: "+234 801 234 5678",
    role: "owner",
    active: true,
    joinedAt: "2023-02-14",
  },
  {
    id: "st2",
    name: "Tolu Ajayi",
    email: "tolu@petalandlash.studio",
    phone: "+234 802 555 0110",
    role: "manager",
    active: true,
    joinedAt: "2024-01-08",
  },
  {
    id: "st3",
    name: "Zainab Musa",
    email: "zainab@petalandlash.studio",
    phone: "+234 806 771 4432",
    role: "stylist",
    active: true,
    joinedAt: "2024-06-21",
  },
  {
    id: "st4",
    name: "Chidi Okonkwo",
    email: "chidi@petalandlash.studio",
    phone: "+234 809 220 8871",
    role: "stylist",
    active: true,
    joinedAt: "2025-03-03",
  },
  {
    id: "st5",
    name: "Bisi Adeleke",
    email: "bisi@petalandlash.studio",
    phone: "+234 703 118 6644",
    role: "front_desk",
    active: true,
    joinedAt: "2025-11-17",
  },
];

export const clients: Client[] = [
  {
    id: "c1",
    name: "Adaeze Okafor",
    phone: "+234 803 111 2244",
    email: "adaeze.o@example.com",
    joinedAt: dayKey(-220),
    notes: "Prefers almond shape, sensitive cuticles.",
  },
  {
    id: "c2",
    name: "Tolu Adeyemi",
    phone: "+234 805 330 7712",
    email: "tolu.a@example.com",
    joinedAt: dayKey(-180),
    notes: "Always books Saturday mornings.",
  },
  {
    id: "c3",
    name: "Chiamaka Eze",
    phone: "+234 806 909 1188",
    email: "chiamaka@example.com",
    joinedAt: dayKey(-140),
  },
  {
    id: "c4",
    name: "Fatima Bello",
    phone: "+234 810 224 5566",
    email: "fatima.b@example.com",
    joinedAt: dayKey(-96),
    notes: "Volume sets only, no glue on the lash line.",
  },
  {
    id: "c5",
    name: "Ngozi Umeh",
    phone: "+234 802 776 3344",
    joinedAt: dayKey(-72),
  },
  {
    id: "c6",
    name: "Zara Lawal",
    phone: "+234 807 441 2299",
    email: "zara.l@example.com",
    joinedAt: dayKey(-45),
    notes: "Brings her own chrome powder sometimes.",
  },
  {
    id: "c7",
    name: "Ifeoma Nwosu",
    phone: "+234 808 663 1100",
    joinedAt: dayKey(-30),
  },
  {
    id: "c8",
    name: "Bisi Adebayo",
    phone: "+234 803 990 5566",
    email: "bisi.adebayo@example.com",
    joinedAt: dayKey(-18),
  },
  {
    id: "c9",
    name: "Amara Obi",
    phone: "+234 809 112 4477",
    joinedAt: dayKey(-9),
    notes: "Referred by Chiamaka.",
  },
  {
    id: "c10",
    name: "Halima Yusuf",
    phone: "+234 806 338 9900",
    email: "halima.y@example.com",
    joinedAt: dayKey(-3),
  },
];

type SeedAppointment = [
  id: string,
  clientId: string,
  serviceId: string,
  staffId: string,
  dayOffset: number,
  time: string,
  status: AppointmentStatus,
  extra?: Partial<Appointment>,
];

const appointmentSeed: SeedAppointment[] = [
  ["a1", "c1", "s1", "st3", -12, "10:00", "completed"],
  ["a2", "c2", "s2", "st4", -9, "12:00", "completed"],
  ["a3", "c3", "s5", "st3", -7, "14:00", "completed"],
  ["a4", "c4", "s4", "st3", -5, "11:00", "completed"],
  ["a5", "c5", "s1", "st4", -4, "16:00", "cancelled", { notes: "Client cancelled 24h ahead." }],
  ["a6", "c6", "s3", "st4", -3, "13:00", "completed"],
  ["a7", "c7", "s6", "st3", -2, "15:00", "completed"],
  ["a8", "c8", "s2", "st4", -1, "10:30", "no_show"],
  ["a9", "c1", "s1", "st3", 0, "09:30", "confirmed"],
  ["a10", "c9", "s5", "st3", 0, "11:00", "confirmed"],
  ["a11", "c10", "s7", "st4", 0, "13:30", "pending"],
  ["a12", "c2", "s3", "st4", 0, "15:00", "confirmed"],
  [
    "a13",
    "c3",
    "s6",
    "st3",
    0,
    "16:30",
    "pending",
    { photo: inspirationPhoto("ink", "Soft cat-eye"), notes: "Wants a thin cat-eye, not too dark." },
  ],
  [
    "a14",
    "c6",
    "s2",
    "st4",
    1,
    "10:00",
    "confirmed",
    { photo: inspirationPhoto("lilac", "Chrome almond") },
  ],
  ["a15", "c5", "s4", "st3", 1, "14:00", "pending"],
  ["a16", "c4", "s1", "st3", 2, "11:30", "confirmed"],
  ["a17", "c7", "s5", "st3", 3, "09:00", "pending"],
  [
    "a18",
    "c8",
    "s3",
    "st4",
    2,
    "12:00",
    "cancelled",
    { photo: inspirationPhoto("cherry", "Micro French"), notes: "Rescheduling next month." },
  ],
];

let referenceCounter = 0;
function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  referenceCounter += 1;
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[(referenceCounter * 7 + i * 11) % alphabet.length];
  }
  return `PL-${code}`;
}

export const appointments: Appointment[] = appointmentSeed.map(
  ([id, clientId, serviceId, staffId, dayOffset, time, status, extra]) => {
    const service = services.find((item) => item.id === serviceId);
    const date = dayKey(dayOffset);
    return {
      id,
      reference: makeReference(),
      clientId,
      serviceId,
      staffId,
      date,
      time,
      status,
      price: service?.price ?? 0,
      createdAt: `${dayKey(Math.min(dayOffset - 3, 0))}T09:00:00`,
      ...extra,
    };
  }
);

type SeedPayment = [
  id: string,
  appointmentId: string,
  method: PaymentMethod,
  status: PaymentStatus,
];

const paymentSeed: SeedPayment[] = [
  ["p1", "a1", "transfer", "completed"],
  ["p2", "a2", "pos", "completed"],
  ["p3", "a3", "card", "completed"],
  ["p4", "a4", "transfer", "completed"],
  ["p5", "a5", "transfer", "refunded"],
  ["p6", "a6", "cash", "completed"],
  ["p7", "a7", "transfer", "completed"],
  ["p8", "a8", "pos", "failed"],
  ["p9", "a9", "pos", "confirmed"],
  ["p10", "a10", "transfer", "confirmed"],
  ["p11", "a11", "cash", "pending"],
  ["p12", "a12", "card", "confirmed"],
  ["p13", "a13", "transfer", "pending"],
  ["p14", "a14", "pos", "confirmed"],
  ["p15", "a15", "cash", "pending"],
  ["p16", "a16", "transfer", "confirmed"],
  ["p17", "a17", "card", "pending"],
  ["p18", "a18", "transfer", "completed"],
];

export const payments: Payment[] = paymentSeed.map(([id, appointmentId, method, status]) => {
  const appointment = appointments.find((item) => item.id === appointmentId);
  return {
    id,
    appointmentId,
    amount: appointment?.price ?? 0,
    method,
    status,
    date: appointment?.date ?? dayKey(0),
    paidAt:
      status === "pending" || status === "failed"
        ? undefined
        : `${appointment?.date ?? dayKey(0)}T${appointment?.time ?? "09:00"}:00`,
  };
});

export const refunds: Refund[] = [
  {
    id: "r1",
    paymentId: "p5",
    amount: 12000,
    reason: "Cancelled more than 24 hours ahead — full refund.",
    status: "paid",
    requestedAt: dayKey(-4),
  },
  {
    id: "r2",
    paymentId: "p18",
    amount: 5000,
    reason: "Client rescheduled and has not rebooked yet.",
    status: "requested",
    requestedAt: dayKey(0),
  },
  {
    id: "r3",
    paymentId: "p3",
    amount: 9000,
    reason: "Lash set loosened within 48 hours — partial goodwill refund.",
    status: "approved",
    requestedAt: dayKey(-2),
  },
];

export const studioProfile: StudioProfile = {
  name: studio.name,
  phone: studio.phone,
  email: studio.email,
  address: studio.address,
  city: studio.city,
  instagram: studio.instagram,
};

export const notificationPrefs: NotificationPrefs = {
  newBookingEmail: true,
  reminderSms: true,
  refundAlerts: true,
  dailySummary: false,
};

/* -------------------------------- selectors ------------------------------- */

export function serviceById(state: AdminState, id: string): Service | undefined {
  return state.services.find((service) => service.id === id);
}

export function clientById(state: AdminState, id: string): Client | undefined {
  return state.clients.find((client) => client.id === id);
}

export function staffById(state: AdminState, id: string): Staff | undefined {
  return state.staff.find((member) => member.id === id);
}

export function paymentForAppointment(state: AdminState, appointmentId: string) {
  return state.payments.find((payment) => payment.appointmentId === appointmentId);
}

export function serviceBookingCount(state: AdminState, serviceId: string): number {
  return state.appointments.filter((appointment) => appointment.serviceId === serviceId).length;
}

export function clientStats(state: AdminState, clientId: string) {
  const visits = state.appointments.filter(
    (appointment) => appointment.clientId === clientId && appointment.status === "completed"
  );
  const upcoming = state.appointments.filter(
    (appointment) =>
      appointment.clientId === clientId &&
      (appointment.status === "pending" || appointment.status === "confirmed")
  );
  const spend = visits.reduce((total, appointment) => total + appointment.price, 0);
  const lastVisit = visits
    .map((appointment) => appointment.date)
    .sort()
    .at(-1);

  return { visits: visits.length, spend, lastVisit, upcoming: upcoming.length };
}

/** Money actually received (confirmed + completed). */
export function collectedTotal(paymentsToSum: Payment[]): number {
  return paymentsToSum
    .filter((payment) => payment.status === "confirmed" || payment.status === "completed")
    .reduce((total, payment) => total + payment.amount, 0);
}
