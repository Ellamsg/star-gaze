"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Skeleton } from "@/components/admin/ui";
import { authKeys, useAuth } from "@/hooks/use-auth";

function AuthLoading() {
  return (
    <div
      role="status"
      aria-label="Checking your session"
      className="flex min-h-dvh items-center justify-center bg-canvas px-6"
    >
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <p className="text-center text-[13px] text-muted">Checking your session…</p>
      </div>
    </div>
  );
}

/**
 * Client-side guard for the admin UI. It is only for redirecting and
 * rendering the right screen — every protected API call is checked again
 * on the server, so bypassing this component grants no access.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: admin, isPending } = useAuth();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      if (admin) router.replace("/admin");
      return;
    }

    if (!isPending && !admin) {
      router.replace("/admin/login");
    }
  }, [admin, isLoginPage, isPending, router]);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(authKeys.me, null);
      if (!isLoginPage) router.replace("/admin/login");
    };

    window.addEventListener("admin:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("admin:unauthorized", handleUnauthorized);
  }, [isLoginPage, queryClient, router]);

  if (isLoginPage) return <>{children}</>;

  if (isPending || !admin) return <AuthLoading />;

  return <>{children}</>;
}
