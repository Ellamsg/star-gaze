import type { Request } from "express";

import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./prisma";

type AuditInput = {
  adminId?: string | null;
  email?: string | null;
  metadata?: Prisma.InputJsonObject;
};

/**
 * Best-effort audit trail. It must never block or break a login attempt,
 * so failures are logged to the console and ignored.
 */
export function audit(
  req: Request,
  action: string,
  input: AuditInput = {}
): void {
  void prisma.adminAuditLog
    .create({
      data: {
        action,
        adminId: input.adminId ?? null,
        email: input.email?.trim().toLowerCase() ?? null,
        ip: req.ip?.slice(0, 64) ?? null,
        userAgent: req.get("user-agent")?.slice(0, 512) ?? null,
        metadata: input.metadata ?? undefined,
      },
    })
    .catch((error) => {
      console.error("Could not write admin audit log", error);
    });
}
