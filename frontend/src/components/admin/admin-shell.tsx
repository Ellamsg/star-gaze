"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { countByRole, useAdmin } from "./store";
import { cn, IconButton, Sheet } from "./ui";
import { Icon, type IconName } from "./icons";
import { initials } from "@/lib/date";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Studio" | "Money" | "Manage";
};

const navigation: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "home", group: "Studio" },
  { href: "/admin/appointments", label: "Appointments", icon: "calendar", group: "Studio" },
  { href: "/admin/availability", label: "Availability", icon: "clock", group: "Studio" },
  { href: "/admin/clients", label: "Clients", icon: "users", group: "Studio" },
  { href: "/admin/payments", label: "Payments", icon: "wallet", group: "Money" },
  { href: "/admin/refunds", label: "Refunds", icon: "refund", group: "Money" },
  { href: "/admin/services", label: "Services", icon: "sparkle", group: "Manage" },
  { href: "/admin/team", label: "Team", icon: "shield", group: "Manage" },
  { href: "/admin/settings", label: "Settings", icon: "settings", group: "Manage" },
];

const groups: Array<NavItem["group"]> = ["Studio", "Money", "Manage"];

const mobileTabs: NavItem[] = [
  { href: "/admin", label: "Home", icon: "home", group: "Studio" },
  { href: "/admin/appointments", label: "Bookings", icon: "calendar", group: "Studio" },
  { href: "/admin/payments", label: "Money", icon: "wallet", group: "Money" },
  { href: "/admin/clients", label: "Clients", icon: "users", group: "Studio" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, toasts, dismissToast } = useAdmin();
  const [moreOpen, setMoreOpen] = useState(false);

  const pendingPayments = state.payments.filter((payment) => payment.status === "pending").length;
  const openRefunds = state.refunds.filter((refund) => refund.status === "requested").length;
  const owner = state.staff.find((member) => member.role === "owner") ?? state.staff[0];

  const badgeFor = (href: string): number => {
    if (href === "/admin/payments") return pendingPayments;
    if (href === "/admin/refunds") return openRefunds;
    return 0;
  };

  return (
    <div className="relative min-h-dvh bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(900px 500px at 12% -10%, rgba(233,139,166,0.18), transparent 60%), radial-gradient(700px 420px at 100% 0%, rgba(217,125,153,0.10), transparent 55%)",
        }}
      />

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-hairline/60 bg-surface/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink text-canvas shadow-[0_10px_30px_-10px_rgba(233,139,166,0.9)]">
            <Icon name="sparkle" size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] uppercase tracking-wide text-cream">
              Stargaze
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">Admin</span>
          </span>
        </Link>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pb-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/60">
                {group}
              </p>
              <ul className="space-y-1">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = isActive(pathname, item.href);
                    const badge = badgeFor(item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                            active
                              ? "bg-pink/12 text-cream shadow-[inset_0_0_0_1px_rgba(233,139,166,0.25)]"
                              : "text-muted hover:bg-white/[0.04] hover:text-cream"
                          )}
                        >
                          <Icon
                            name={item.icon}
                            size={18}
                            className={active ? "text-pink" : undefined}
                          />
                          <span className="flex-1">{item.label}</span>
                          {badge > 0 ? (
                            <span className="rounded-full bg-pink/20 px-1.5 py-0.5 text-[10px] font-semibold text-pink">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="rounded-[22px] border border-hairline/70 bg-canvas/40 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink/15 text-[11px] font-semibold text-pink">
              {initials(owner?.name ?? "Admin")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-cream">{owner?.name}</p>
              <p className="truncate text-[11px] text-muted">{countByRole(state.staff, "stylist")} artists</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-full border border-hairline/80 py-2 text-[12px] text-muted transition hover:border-white/20 hover:text-cream"
          >
            <Icon name="arrowUpRight" size={13} />
            View site
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-hairline/60 bg-canvas/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink text-canvas">
            <Icon name="sparkle" size={17} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight text-cream">
             Stargaze
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline/70 bg-white/[0.03] text-cream/80"
          >
            <Icon name="settings" size={17} />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink/15 text-[11px] font-semibold text-pink">
            {initials(owner?.name ?? "Admin")}
          </span>
        </div>
      </header>

      <main className="lg:pl-[252px]">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline/60 bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 py-1.5">
          {mobileTabs.map((tab) => {
            const active = isActive(pathname, tab.href);
            const badge = badgeFor(tab.href);

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition",
                    active ? "text-pink" : "text-muted"
                  )}
                >
                  <span className="relative">
                    <Icon name={tab.icon} size={20} />
                    {badge > 0 ? (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 text-[9px] font-bold text-canvas">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition",
                moreOpen ? "text-pink" : "text-muted"
              )}
            >
              <Icon name="more" size={20} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        description="Studio tools and account settings."
      >
        <div className="grid grid-cols-2 gap-2.5">
          {navigation
            .filter((item) => !mobileTabs.some((tab) => tab.href === item.href))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-hairline/70 bg-white/[0.03] px-4 py-3.5 text-sm text-cream transition active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink/12 text-pink">
                  <Icon name={item.icon} size={17} />
                </span>
                {item.label}
              </Link>
            ))}
        </div>
        <Link
          href="/"
          onClick={() => setMoreOpen(false)}
          className="mt-3 flex items-center justify-between rounded-2xl border border-hairline/70 px-4 py-3.5 text-sm text-muted"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <Icon name="arrowUpRight" size={17} />
            </span>
            Back to the site
          </span>
          <Icon name="chevronRight" size={16} />
        </Link>
      </Sheet>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={cn(
              "pointer-events-auto max-w-sm rounded-2xl border px-4 py-3 text-left text-[13px] shadow-2xl backdrop-blur-xl",
              toast.tone === "success"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                : toast.tone === "danger"
                  ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
                  : "border-hairline/80 bg-surface/95 text-cream"
            )}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <IconButton icon="bell" label="Notifications" />
    </div>
  );
}
