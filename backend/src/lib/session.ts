import { createHash, randomBytes } from "node:crypto";

import type { CookieOptions, Request, Response } from "express";

import { prisma } from "./prisma";

const isProduction = process.env.NODE_ENV === "production";

/** `__Host-` requires Secure + Path=/ + no Domain, which we satisfy in prod. */
export const SESSION_COOKIE = isProduction
  ? "__Host-admin_session"
  : "admin_session";

const SESSION_TTL_MS =
  Math.max(1, Number(process.env.ADMIN_SESSION_TTL_HOURS) || 12) * 60 * 60 * 1000;

/** Avoid a database write on every request just to bump lastSeenAt. */
const LAST_SEEN_WRITE_MS = 5 * 60 * 1000;

const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_TTL_MS });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieBase);
}

export function sessionTokenFromRequest(req: Request): string | null {
  const token = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" && token.length > 0 ? token : null;
}

export type SessionMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export async function createSession(adminId: string, meta: SessionMeta) {
  const token = newSessionToken();

  const session = await prisma.adminSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      adminId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta.ip?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
    },
  });

  return { token, session };
}

export async function findSession(token: string) {
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    if (!session.revokedAt) {
      await prisma.adminSession
        .update({ where: { id: session.id }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    }
    return null;
  }

  if (!session.admin.isActive) return null;

  if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_WRITE_MS) {
    // Fire-and-forget: never fail a request because a timestamp write failed.
    void prisma.adminSession
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  return session;
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.adminSession.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(
  adminId: string,
  exceptSessionId?: string
): Promise<void> {
  await prisma.adminSession.updateMany({
    where: {
      adminId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}
