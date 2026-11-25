import type { NextFunction, Request, Response } from "express";

import type { AdminRole } from "../generated/prisma/enums";
import { asyncHandler } from "../lib/async-handler";
import { HttpError } from "../lib/http-error";
import {
  clearSessionCookie,
  findSession,
  sessionTokenFromRequest,
} from "../lib/session";

export type Permission =
  | "services:write"
  | "categories:write"
  | "availability:write"
  | "appointments:read"
  | "appointments:write"
  | "clients:read"
  | "clients:write"
  | "team:write"
  | "settings:write";

const ALL_PERMISSIONS: Permission[] = [
  "services:write",
  "categories:write",
  "availability:write",
  "appointments:read",
  "appointments:write",
  "clients:read",
  "clients:write",
  "team:write",
  "settings:write",
];

/**
 * Role permissions are deliberately explicit. Only OWNER exists today, but
 * the route middleware already understands the other roles for when staff
 * accounts are added.
 */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  MANAGER: [
    "services:write",
    "categories:write",
    "availability:write",
    "appointments:read",
    "appointments:write",
    "clients:read",
    "clients:write",
  ],
  TECH: ["appointments:read"],
};

export function hasPermission(
  role: AdminRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Rejects the request unless it carries a live, unrevoked admin session. */
export const requireAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = sessionTokenFromRequest(req);

    if (!token) {
      throw new HttpError(401, "Please sign in to continue.");
    }

    const session = await findSession(token);

    if (!session) {
      clearSessionCookie(res);
      throw new HttpError(401, "Your session expired. Please sign in again.");
    }

    req.admin = {
      id: session.admin.id,
      email: session.admin.email,
      name: session.admin.name,
      role: session.admin.role,
      sessionId: session.id,
      mustChangePassword: session.admin.mustChangePassword,
    };

    next();
  }
);

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new HttpError(401, "Please sign in to continue."));
      return;
    }

    if (!roles.includes(req.admin.role)) {
      next(new HttpError(403, "You don't have permission to do that."));
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new HttpError(401, "Please sign in to continue."));
      return;
    }

    if (!hasPermission(req.admin.role, permission)) {
      next(new HttpError(403, "You don't have permission to do that."));
      return;
    }

    next();
  };
}
