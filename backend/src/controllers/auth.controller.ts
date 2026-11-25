import type { Request, Response } from "express";

import { audit } from "../lib/audit";
import { HttpError } from "../lib/http-error";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../lib/password";
import { prisma } from "../lib/prisma";
import {
  clearSessionCookie,
  createSession,
  revokeAllSessions,
  revokeSession,
  sessionTokenFromRequest,
  setSessionCookie,
} from "../lib/session";
import type {
  ChangePasswordInput,
  LoginInput,
} from "../validators/auth.schema";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

type AdminRow = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "MANAGER" | "TECH";
  mustChangePassword: boolean;
};

function toDto(admin: AdminRow) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
  };
}

/* ------------------------------- POST /api/auth/login ------------------------------ */

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    await burnPasswordCheck(password);
    audit(req, "login_failed", { email, metadata: { reason: "unknown_email" } });
    throw new HttpError(401, "Email or password is incorrect.");
  }

  if (!admin.isActive) {
    await burnPasswordCheck(password);
    audit(req, "login_failed", {
      adminId: admin.id,
      email,
      metadata: { reason: "inactive" },
    });
    throw new HttpError(401, "Email or password is incorrect.");
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    audit(req, "login_failed", {
      adminId: admin.id,
      email,
      metadata: { reason: "locked" },
    });
    throw new HttpError(429, "Too many attempts. Please try again later.");
  }

  const valid = await verifyPassword(admin.passwordHash, password);

  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MS) : null,
      },
    });

    audit(req, "login_failed", {
      adminId: admin.id,
      email,
      metadata: { reason: "bad_password", attempts },
    });

    throw new HttpError(401, "Email or password is incorrect.");
  }

  const now = new Date();

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
    },
  });

  const { token } = await createSession(admin.id, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  setSessionCookie(res, token);
  audit(req, "login", { adminId: admin.id, email: admin.email });

  res.json({
    data: toDto({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    }),
  });
}

/* ------------------------------ POST /api/auth/logout ------------------------------ */

export async function logout(req: Request, res: Response): Promise<void> {
  const token = sessionTokenFromRequest(req);

  if (token) {
    await revokeSession(token);
    audit(req, "logout");
  }

  clearSessionCookie(res);
  res.status(204).send();
}

/* -------------------------------- GET /api/auth/me -------------------------------- */

export async function me(req: Request, res: Response): Promise<void> {
  const admin = req.admin;

  if (!admin) {
    throw new HttpError(401, "Please sign in to continue.");
  }

  res.json({
    data: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: admin.mustChangePassword,
    },
  });
}

/* -------------------------- POST /api/auth/change-password -------------------------- */

export async function changePassword(
  req: Request,
  res: Response
): Promise<void> {
  const admin = req.admin;

  if (!admin) {
    throw new HttpError(401, "Please sign in to continue.");
  }

  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  const row = await prisma.admin.findUnique({ where: { id: admin.id } });

  if (!row) {
    clearSessionCookie(res);
    throw new HttpError(401, "Your account no longer exists.");
  }

  const valid = await verifyPassword(row.passwordHash, currentPassword);

  if (!valid) {
    audit(req, "password_change_failed", {
      adminId: admin.id,
      email: admin.email,
      metadata: { reason: "bad_current_password" },
    });
    throw new HttpError(400, "Your current password is incorrect.");
  }

  if (await verifyPassword(row.passwordHash, newPassword)) {
    throw new HttpError(400, "Choose a password you haven't used here before.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // A stolen session should not survive a password change.
  await revokeAllSessions(admin.id, admin.sessionId);
  audit(req, "password_changed", {
    adminId: admin.id,
    email: admin.email,
  });

  res.json({
    data: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: false,
    },
  });
}

/* ----------------------------- POST /api/auth/logout-all ---------------------------- */

export async function logoutAll(req: Request, res: Response): Promise<void> {
  const admin = req.admin;

  if (!admin) {
    throw new HttpError(401, "Please sign in to continue.");
  }

  await revokeAllSessions(admin.id);
  clearSessionCookie(res);
  audit(req, "logout_all", { adminId: admin.id, email: admin.email });

  res.status(204).send();
}
