import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../lib/http-error";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

/** Prisma puts a code like "P2002" on its known errors. */
function prismaErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Last middleware in the stack. Express recognises it as an error handler
 * because it takes four arguments — that 4th `next` must stay, even unused.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  switch (prismaErrorCode(err)) {
    case "P2002":
      res.status(409).json({ error: "A record with that value already exists" });
      return;
    case "P2025":
      res.status(404).json({ error: "Record not found" });
      return;
    case "P2003":
      // Foreign key violation — e.g. deleting a service that still has bookings.
      res.status(409).json({ error: "This record is still used by other records" });
      return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}