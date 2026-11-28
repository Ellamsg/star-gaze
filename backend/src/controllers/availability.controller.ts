import type { Request, Response } from "express";

import {
  appointmentsForDay,
  buildOpenTimes,
  getAdminDay,
  getDayState,
  getMonthState,
  getSchedule,
  saveSchedule,
  type ScheduleSettings,
} from "../lib/availability";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { studioTodayKey } from "../lib/timezone";
import type {
  CreateBlockInput,
  DayOverrideInput,
  PublicDayQuery,
  PublicMonthQuery,
  ScheduleInput,
} from "../validators/availability.schema";

function noStore(res: Response): void {
  res.setHeader("Cache-Control", "private, no-store");
}

/* ------------------------- public: one day's times ------------------------ */

export async function getPublicDay(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as PublicDayQuery;
  const dateKey = query.date ?? studioTodayKey();
  const duration = query.duration ?? 30;

  const state = await getDayState(dateKey);
  const appointments = await appointmentsForDay(dateKey);
  const times = buildOpenTimes(state, {
    durationMin: duration,
    appointments,
  });

  noStore(res);
  res.json({
    data: {
      date: state.date,
      isOpen: state.reason === "open",
      reason: state.reason,
      openTime: state.openTime,
      closeTime: state.closeTime,
      stepMinutes: state.stepMinutes,
      note: state.note,
      blocks: state.blocks,
      times,
    },
  });
}

/* ------------------------ public: month calendar ------------------------ */

export async function getPublicMonth(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as PublicMonthQuery;
  const month = query.month ?? studioTodayKey().slice(0, 7);

  const data = await getMonthState(month, {
    durationMin: query.duration ?? 30,
  });

  noStore(res);
  res.json({ data });
}

/* ----------------------------- admin settings ---------------------------- */

export async function getSettings(
  _req: Request,
  res: Response
): Promise<void> {
  noStore(res);
  res.json({ data: await getSchedule() });
}

export async function updateSettings(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as ScheduleInput;
  const data = await saveSchedule(input as ScheduleSettings);
  noStore(res);
  res.json({ data });
}

/* ------------------------------ admin month ------------------------------ */

export async function getAdminMonth(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as { month: string };
  const data = await getMonthState(query.month, { admin: true });
  noStore(res);
  res.json({ data });
}

/* ------------------------------- admin day ------------------------------- */

export async function getAdminDayHandler(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as { date: string };
  const data = await getAdminDay(query.date);
  noStore(res);
  res.json({ data });
}

export async function upsertDayOverride(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as { date: string };
  const input = req.body as DayOverrideInput;

  await prisma.dayOverride.upsert({
    where: { date: query.date },
    create: {
      date: query.date,
      isClosed: input.isClosed,
      openTime: input.openTime ?? null,
      closeTime: input.closeTime ?? null,
      stepMinutes: input.stepMinutes ?? null,
      note: input.note ?? null,
    },
    update: {
      isClosed: input.isClosed,
      openTime: input.openTime ?? null,
      closeTime: input.closeTime ?? null,
      stepMinutes: input.stepMinutes ?? null,
      note: input.note ?? null,
    },
  });

  const data = await getAdminDay(query.date);
  noStore(res);
  res.json({ data });
}

export async function deleteDayOverride(
  req: Request,
  res: Response
): Promise<void> {
  const query = req.query as unknown as { date: string };

  await prisma.dayOverride.deleteMany({ where: { date: query.date } });

  const data = await getAdminDay(query.date);
  noStore(res);
  res.json({ data });
}

/* ------------------------------- time blocks ----------------------------- */

export async function createBlock(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as CreateBlockInput;

  await prisma.scheduleBlock.create({
    data: {
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      note: input.note ?? null,
    },
  });

  const data = await getAdminDay(input.date);
  noStore(res);
  res.status(201).json({ data });
}

export async function deleteBlock(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);

  const block = await prisma.scheduleBlock.findUnique({ where: { id } });
  if (!block) throw new HttpError(404, "That closed time no longer exists.");

  await prisma.scheduleBlock.delete({ where: { id } });

  const data = await getAdminDay(block.date);
  noStore(res);
  res.json({ data });
}
