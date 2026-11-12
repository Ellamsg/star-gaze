import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import type {
  CreateSlotsInput,
  ListSlotsQuery,
  UpdateSlotInput,
} from "../validators/availability.schema";

/**
 * The studio's timezone. Africa/Lagos = UTC+1 all year (no DST).
 * Change this number if the studio is somewhere else, e.g. UTC+0 = 0.
 */
const STUDIO_UTC_OFFSET_MIN = 60;
const DAY_MS = 86_400_000;

/* ------------------------- timezone helpers ------------------------- */

function studioDateKey(date: Date): string {
  const shifted = new Date(date.getTime() + STUDIO_UTC_OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(0, 10);
}

function studioTime(date: Date): string {
  const shifted = new Date(date.getTime() + STUDIO_UTC_OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(11, 16);
}

/** "2026-11-02" + "13:00" (studio local) -> UTC Date */
function studioToUtc(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes) -
      STUDIO_UTC_OFFSET_MIN * 60_000
  );
}

function dayStart(dateKey: string): Date {
  return studioToUtc(dateKey, "00:00");
}

function dayEnd(dateKey: string): Date {
  return new Date(dayStart(dateKey).getTime() + DAY_MS);
}

/* ------------------------------ DTO -------------------------------- */

type SlotRow = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  note: string | null;
  appointment?: { id: string } | null;
};

function toDto(slot: SlotRow) {
  return {
    id: slot.id,
    date: studioDateKey(slot.startAt),
    time: studioTime(slot.startAt),
    endTime: studioTime(slot.endAt),
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt.toISOString(),
    durationMin: Math.round(
      (slot.endAt.getTime() - slot.startAt.getTime()) / 60_000
    ),
    status: slot.status,
    note: slot.note,
    appointmentId: slot.appointment?.id ?? null,
  };
}

/* --------------------------- GET /api/availability --------------------------- */
/** Public: only OPEN slots, today onwards. */
export async function listOpenSlots(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as ListSlotsQuery;

  const from = query.from
    ? dayStart(query.from)
    : dayStart(studioDateKey(new Date()));
  const to = query.to
    ? dayEnd(query.to)
    : new Date(from.getTime() + 60 * DAY_MS);

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      status: "OPEN",
      startAt: { gte: from, lt: to },
    },
    orderBy: { startAt: "asc" },
    include: { appointment: { select: { id: true } } },
  });

  const visible = query.minDuration
    ? slots.filter(
        (slot) =>
          slot.endAt.getTime() - slot.startAt.getTime() >=
          query.minDuration! * 60_000
      )
    : slots;

  res.json({ data: visible.map(toDto) });
}

/* ------------------------- GET /api/availability/all ------------------------- */
/** Admin: every slot, including BOOKED and BLOCKED. */
export async function listAllSlots(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as ListSlotsQuery;

  const from = query.from
    ? dayStart(query.from)
    : dayStart(studioDateKey(new Date()));
  const to = query.to
    ? dayEnd(query.to)
    : new Date(from.getTime() + 60 * DAY_MS);

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      startAt: { gte: from, lt: to },
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: { startAt: "asc" },
    include: { appointment: { select: { id: true } } },
  });

  res.json({ data: slots.map(toDto) });
}

/* ------------------------- POST /api/availability ------------------------- */
/** Admin: create one or many OPEN slots. Duplicates are skipped. */
export async function createSlots(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as CreateSlotsInput;

  const data = input.slots.map((slot) => {
    const startAt = studioToUtc(slot.date, slot.time);
    const minutes = slot.durationMin ?? input.durationMin;

    return {
      startAt,
      endAt: new Date(startAt.getTime() + minutes * 60_000),
      note: input.note ?? null,
      staffId: input.staffId ?? null,
    };
  });

  const result = await prisma.availabilitySlot.createMany({
    data,
    skipDuplicates: true,
  });

  res.status(201).json({
    data: {
      created: result.count,
      skipped: data.length - result.count,
    },
  });
}

/* ----------------------- PATCH /api/availability/:id ----------------------- */
/** Admin: close (BLOCKED) or reopen (OPEN) a single slot. */
export async function updateSlot(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);
  const input = req.body as UpdateSlotInput;

  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot) throw new HttpError(404, "Slot not found");

  if (slot.status === "BOOKED") {
    throw new HttpError(
      409,
      "This slot has a booking. Cancel the booking first — the slot will reopen automatically."
    );
  }

  const updated = await prisma.availabilitySlot.update({
    where: { id },
    data: { status: input.status },
    include: { appointment: { select: { id: true } } },
  });

  res.json({ data: toDto(updated) });
}

/* ---------------------- DELETE /api/availability/:id ---------------------- */
/** Admin: permanently remove a slot. Booked slots must be cancelled first. */
export async function deleteSlot(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);

  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot) throw new HttpError(404, "Slot not found");

  if (slot.status === "BOOKED") {
    throw new HttpError(
      409,
      "This slot has a booking. Cancel the booking first."
    );
  }

  await prisma.availabilitySlot.delete({ where: { id } });
  res.status(204).send();
}

/* ------------------- POST /api/availability/cancel-day ------------------- */
/** Admin: close every OPEN slot on one date (holiday / day off). */
export async function cancelDay(
  req: Request,
  res: Response
): Promise<void> {
  const { date } = req.body as { date: string };
  const range = { gte: dayStart(date), lt: dayEnd(date) };

  const result = await prisma.availabilitySlot.updateMany({
    where: { startAt: range, status: "OPEN" },
    data: { status: "BLOCKED" },
  });

  const booked = await prisma.availabilitySlot.count({
    where: { startAt: range, status: "BOOKED" },
  });

  res.json({
    data: { date, closed: result.count, bookedLeftAlone: booked },
  });
}
