import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "../validators/appointment.schema";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** "PL-8F3K2M" — short enough to read over the phone. */
function makeReference(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `PL-${code}`;
}

/** "0803 123 4567" -> "+2348031234567". Change 234 if not Nigeria. */
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  if (!digits.startsWith("234")) digits = `234${digits}`;
  return `+${digits}`;
}

async function cancelRecord(appointment: {
  id: string;
  status: string;
  slotId: string | null;
}): Promise<void> {
  if (appointment.status === "COMPLETED") {
    throw new HttpError(409, "Completed bookings cannot be cancelled.");
  }

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointment.id },
      // Clear slotId so the reopened slot can be booked again (slotId is unique).
      data: { status: "CANCELLED", slotId: null },
    }),
    ...(appointment.slotId
      ? [
          prisma.availabilitySlot.update({
            where: { id: appointment.slotId },
            data: { status: "OPEN" },
          }),
        ]
      : []),
  ]);
}

/* ------------------------ admin DTO (GET list) ------------------------ */

type AppointmentRow = {
  id: string;
  reference: string;
  status: string;
  startAt: Date;
  endAt: Date;
  price: unknown; // Prisma Decimal
  notes: string | null;
  createdAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  staff: { id: string; name: string } | null;
  slot: { id: string; startAt: Date; endAt: Date } | null;
  items: Array<{
    id: string;
    price: unknown;
    durationMin: number;
    service: { id: string; name: string };
  }>;
  photos: Array<{ id: string; url: string }>;
};

/**
 * Admin list shape. Deliberately omits manageToken: that token is the client's
 * proof for cancelling a booking and has no place in the dashboard.
 */
function toAdminDto(appointment: AppointmentRow) {
  return {
    id: appointment.id,
    reference: appointment.reference,
    status: appointment.status,
    startAt: appointment.startAt.toISOString(),
    endAt: appointment.endAt.toISOString(),
    price: Number(appointment.price),
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    client: {
      id: appointment.client.id,
      firstName: appointment.client.firstName,
      lastName: appointment.client.lastName,
      email: appointment.client.email,
      phone: appointment.client.phone,
    },
    staff: appointment.staff
      ? { id: appointment.staff.id, name: appointment.staff.name }
      : null,
    slot: appointment.slot
      ? {
          id: appointment.slot.id,
          startAt: appointment.slot.startAt.toISOString(),
          endAt: appointment.slot.endAt.toISOString(),
        }
      : null,
    items: appointment.items.map((item) => ({
      id: item.id,
      price: Number(item.price),
      durationMin: item.durationMin,
      service: { id: item.service.id, name: item.service.name },
    })),
    photos: appointment.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
    })),
  };
}

/* ---------------------- GET /api/appointments (admin) ---------------------- */
export async function listAppointments(
  _req: Request,
  res: Response
): Promise<void> {
  const appointments = await prisma.appointment.findMany({
    include: {
      client: true,
      staff: { select: { id: true, name: true } },
      slot: { select: { id: true, startAt: true, endAt: true } },
      items: { include: { service: { select: { id: true, name: true } } } },
      photos: { select: { id: true, url: true } },
    },
    orderBy: { startAt: "desc" },
  });

  res.json({ data: appointments.map(toAdminDto) });
}

/* ---------------------- POST /api/appointments ---------------------- */
export async function createAppointment(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as CreateAppointmentInput;

  /* 1 — the slot must still exist and be open */
  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: input.slotId },
  });
  if (!slot) throw new HttpError(404, "That time slot no longer exists.");
  if (slot.status !== "OPEN") {
    throw new HttpError(409, "That time was just taken. Please pick another slot.");
  }

  /* 2 — services must exist and fit inside the slot */
  const uniqueIds = [...new Set(input.serviceIds)];
  const found = await prisma.service.findMany({
    where: { id: { in: uniqueIds }, active: true },
  });
  if (found.length !== uniqueIds.length) {
    throw new HttpError(400, "One or more services are no longer available.");
  }

  const byId = new Map(found.map((service) => [service.id, service]));
  const services = uniqueIds.map((id) => byId.get(id)!);

  const totalMin = services.reduce((sum, service) => sum + service.durationMin, 0);
  const totalPrice = services.reduce(
    (sum, service) => sum + Number(service.price),
    0
  );
  const slotMin = Math.round(
    (slot.endAt.getTime() - slot.startAt.getTime()) / 60_000
  );

  if (totalMin > slotMin) {
    throw new HttpError(
      400,
      `That slot is ${slotMin} minutes long but your services need ${totalMin}. Pick a longer slot or fewer services.`
    );
  }

  /* 3 — find or create the client */
  const phone = normalizePhone(input.phone);
  const email = input.email?.toLowerCase() ?? null;

  const existing = await prisma.client.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });

  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || null;

  const client = existing
    ? await prisma.client.update({
        where: { id: existing.id },
        data: { firstName, lastName, phone, ...(email ? { email } : {}) },
      })
    : await prisma.client.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          marketingOptIn: input.marketingOptIn ?? false,
        },
      });

  /* 4 — claim the slot + create the booking atomically */
  const appointment = await prisma.$transaction(async (tx) => {
    const claimed = await tx.availabilitySlot.updateMany({
      where: { id: slot.id, status: "OPEN" },
      data: { status: "BOOKED" },
    });

    // Someone else won the race between step 1 and here.
    if (claimed.count !== 1) {
      throw new HttpError(409, "That time was just taken. Please pick another slot.");
    }

    return tx.appointment.create({
      data: {
        reference: makeReference(),
        manageToken: randomUUID(),
        clientId: client.id,
        serviceId: services[0].id,
        slotId: slot.id,
        startAt: slot.startAt,
        endAt: new Date(slot.startAt.getTime() + totalMin * 60_000),
        price: totalPrice,
        status: "PENDING",
        notes: input.note ?? null,
        items: {
          create: services.map((service) => ({
            serviceId: service.id,
            price: service.price,
            durationMin: service.durationMin,
          })),
        },
      },
      include: { items: { include: { service: true } } },
    });
  });

  res.status(201).json({
    data: {
      id: appointment.id,
      reference: appointment.reference,
      manageToken: appointment.manageToken,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      price: Number(appointment.price),
      services: appointment.items.map((item) => ({
        id: item.service.id,
        name: item.service.name,
      })),
    },
  });
}

/* --------------- PATCH /api/appointments/:id/cancel (admin) --------------- */
export async function cancelAppointment(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new HttpError(404, "Booking not found");

  await cancelRecord(appointment);
  res.json({ data: { id, status: "CANCELLED" } });
}

/* ---------------- PATCH /api/appointments/:id/status (admin) ---------------- */
export async function updateAppointmentStatus(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);
  const { status } = req.body as UpdateAppointmentStatusInput;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new HttpError(404, "Booking not found");

  // Cancelling must also free the slot, so reuse the same guarded path.
  if (status === "CANCELLED") {
    await cancelRecord(appointment);
    res.json({ data: { id, status } });
    return;
  }

  await prisma.$transaction([
    prisma.appointment.update({ where: { id }, data: { status } }),
    ...(status === "COMPLETED"
      ? [
          prisma.client.update({
            where: { id: appointment.clientId },
            data: { lastVisitAt: appointment.endAt },
          }),
        ]
      : []),
  ]);

  res.json({ data: { id, status } });
}

/* --------------- POST /api/appointments/cancel (client link) --------------- */
export async function cancelByToken(
  req: Request,
  res: Response
): Promise<void> {
  const { token } = req.body as { token: string };

  const appointment = await prisma.appointment.findUnique({
    where: { manageToken: token },
  });
  if (!appointment) throw new HttpError(404, "Booking not found");

  await cancelRecord(appointment);
  res.json({ data: { reference: appointment.reference, status: "CANCELLED" } });
}
