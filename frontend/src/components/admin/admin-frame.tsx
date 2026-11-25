"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthGate } from "./auth-gate";
import { AdminShell } from "./admin-shell";

/**
 * The login screen must not render inside the dashboard shell. Everything
 * else is wrapped in the session guard and the admin chrome.
 */
export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AuthGate>
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
