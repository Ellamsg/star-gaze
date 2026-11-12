import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import type { UpdateClientInput } from "../validators/client.schema";

type ClientRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  marketingOptIn: boolean;
  lastVisitAt: Date | null;
  createdAt: Date;
  appointments: Array<{
    id: string;
    reference: string;
    status: string;
    startAt: Date;
    endAt: Date;
    price: unknown; // Prisma Decimal
    notes: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      price: unknown; // Prisma Decimal
      durationMin: number;
      service: { id: string; name: string };
    }>;
  }>;
};

/**
 * Client + booking history for the admin list. Like the appointments DTO,
 * this intentionally leaves out manageToken.
 */
function toDto(client: ClientRow) {
  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
    marketingOptIn: client.marketingOptIn,
    lastVisitAt: client.lastVisitAt?.toISOString() ?? null,
    createdAt: client.createdAt.toISOString(),
    appointments: client.appointments.map((appointment) => ({
      id: appointment.id,
      reference: appointment.reference,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      price: Number(appointment.price),
      notes: appointment.notes,
      createdAt: appointment.createdAt.toISOString(),
      items: appointment.items.map((item) => ({
        id: item.id,
        price: Number(item.price),
        durationMin: item.durationMin,
        service: { id: item.service.id, name: item.service.name },
      })),
    })),
  };
}

const clientWithAppointments = {
  appointments: {
    orderBy: { startAt: "desc" as const },
    include: {
      items: {
        include: {
          service: { select: { id: true, name: true } },
        },
      },
    },
  },
};

/* ------------------------- GET /api/clients (admin) ------------------------- */
export async function listClients(
  _req: Request,
  res: Response
): Promise<void> {
  const clients = await prisma.client.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    include: clientWithAppointments,
  });

  res.json({ data: clients.map(toDto) });
}

/* ---------------------- PATCH /api/clients/:id (admin) ---------------------- */
export async function updateClient(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);
  const input = req.body as UpdateClientInput;

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Client not found");

  const updated = await prisma.client.update({
    where: { id },
    data: { notes: input.notes },
  });

  res.json({
    data: {
      id: updated.id,
      notes: updated.notes,
    },
  });
}
