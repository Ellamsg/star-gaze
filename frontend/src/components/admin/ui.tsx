"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { formatNaira } from "@/data/site";
import {
  appointmentStatusLabels,
  paymentStatusLabels,
  refundStatusLabels,
  type AppointmentStatus,
  type PaymentStatus,
  type RefundStatus,
  type ServiceTone,
} from "@/data/admin";
import { initials } from "@/lib/date";

import { Spinner } from "@/components/spinner";

import { Icon, type IconName } from "./icons";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/* ---------------------------------- tones --------------------------------- */

type Tone = "neutral" | "pink" | "sky" | "green" | "amber" | "red" | "slate";

const toneClasses: Record<Tone, string> = {
  neutral: "border-white/12 bg-white/[0.06] text-cream/80",
  pink: "border-pink/30 bg-pink/12 text-pink",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  red: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  slate: "border-white/10 bg-white/[0.03] text-muted",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none",
        toneClasses[tone]
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

const appointmentTones: Record<AppointmentStatus, Tone> = {
  pending: "amber",
  confirmed: "sky",
  completed: "green",
  cancelled: "red",
  no_show: "slate",
};

const paymentTones: Record<PaymentStatus, Tone> = {
  pending: "amber",
  confirmed: "sky",
  completed: "green",
  refunded: "pink",
  failed: "red",
};

const refundTones: Record<RefundStatus, Tone> = {
  requested: "amber",
  approved: "sky",
  paid: "green",
  declined: "red",
};

export function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge tone={appointmentTones[status]} dot>
      {appointmentStatusLabels[status]}
    </Badge>
  );
}

const bookingPaymentLabels: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  confirmed: "Paid",
  completed: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

/** `context="booking"` says Paid/Unpaid, which reads better inside an appointment. */
export function PaymentBadge({
  status,
  context = "payment",
}: {
  status: PaymentStatus;
  context?: "payment" | "booking";
}) {
  const tone =
    context === "booking" && (status === "confirmed" || status === "completed")
      ? "green"
      : paymentTones[status];

  return (
    <Badge tone={tone}>
      <Icon name="wallet" size={11} />
      {context === "booking" ? bookingPaymentLabels[status] : paymentStatusLabels[status]}
    </Badge>
  );
}

export function RefundBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge tone={refundTones[status]} dot>
      {refundStatusLabels[status]}
    </Badge>
  );
}

/* --------------------------------- buttons -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: IconName;
  /** Shows a spinner and disables the button while an action is running. */
  loading?: boolean;
};

const buttonVariants = {
  primary:
    "bg-pink text-canvas shadow-[0_10px_30px_-12px_rgba(233,139,166,0.8)] hover:bg-rose active:scale-[0.99]",
  secondary:
    "border border-hairline/80 bg-white/[0.04] text-cream hover:border-white/20 hover:bg-white/[0.08]",
  ghost: "text-muted hover:bg-white/5 hover:text-cream",
  danger:
    "border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className,
  children,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-sm",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "sm" ? 14 : 16} />
      ) : icon ? (
        <Icon name={icon} size={size === "sm" ? 15 : 17} />
      ) : null}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/70 bg-white/[0.03] text-cream/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-cream",
        className
      )}
      {...props}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

/* ---------------------------------- cards --------------------------------- */

export function Card({
  className,
  children,
  as: Component = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Component
      className={cn(
        "rounded-[26px] border border-hairline/60 bg-surface/70 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function SectionHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-cream">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- page header ------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-[clamp(2rem,7vw,3rem)] uppercase leading-[0.95] text-cream">
          {title}
          {accent ? (
            <>
              {" "}
              <span className="font-serif text-[1.02em] italic normal-case text-pink">
                {accent}
              </span>
            </>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

/* --------------------------------- filters -------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition",
              active
                ? "border-pink bg-pink text-canvas"
                : "border-hairline/80 bg-white/[0.03] text-muted hover:border-white/20 hover:text-cream"
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                  active ? "bg-canvas/15 text-canvas" : "bg-white/8 text-muted"
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- sheet --------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[30px] border border-hairline/80 bg-surface shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.8)] sm:rounded-[30px]",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug text-cream">{title}</h2>
            {description ? (
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {children}
        </div>
        {footer ? (
          <footer className="border-t border-hairline/70 bg-surface/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------- forms --------------------------------- */

const fieldBase =
  "w-full rounded-2xl border border-hairline/80 bg-canvas/60 px-4 text-[15px] text-cream placeholder:text-muted/50 outline-none transition focus:border-pink/60 focus:ring-4 focus:ring-pink/10 disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-cream/85">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-300">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24 resize-y py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-12 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-cream">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition",
          checked ? "border-pink bg-pink" : "border-hairline bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-canvas transition-all",
            checked ? "left-[22px]" : "left-0.5 bg-cream/70"
          )}
        />
      </button>
    </div>
  );
}

/* ---------------------------------- misc ---------------------------------- */

const toneGradients: Record<ServiceTone, string> = {
  blush: "linear-gradient(135deg,#f7d7e2,#c9778f)",
  lilac: "linear-gradient(135deg,#ded5f2,#8a6fbd)",
  cherry: "linear-gradient(135deg,#f3c3c9,#a12a3b)",
  clay: "linear-gradient(135deg,#efdfcf,#a9805f)",
  sage: "linear-gradient(135deg,#dfe4d6,#7f8a6d)",
  ink: "linear-gradient(140deg,#4a3f42,#1a1416)",
};

export function PhotoFrame({
  photo,
  tone = "blush",
  label,
  className,
  rounded = "rounded-2xl",
}: {
  photo?: string;
  tone?: ServiceTone;
  label: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", rounded, className)}
      style={photo ? undefined : { backgroundImage: toneGradients[tone] }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URLs from the upload input
        <img src={photo} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-serif text-2xl italic text-white/80">{initials(label)}</span>
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, tone = "neutral" }: { name: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold",
        toneClasses[tone]
      )}
    >
      {initials(name)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "min-w-[190px] flex-1 p-4 sm:min-w-0",
        accent && "border-pink/25 bg-[linear-gradient(150deg,rgba(233,139,166,0.16),rgba(42,32,35,0.9))]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <span className={cn("rounded-full p-1.5", accent ? "bg-pink/20 text-pink" : "bg-white/5 text-muted")}>
          <Icon name={icon} size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-[26px] leading-none text-cream">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  icon = "sparkle",
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-hairline/80 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-muted">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <p className="text-sm font-medium text-cream">{title}</p>
        {body ? <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatNaira(value)}</span>;
}

/** Pulsing placeholder used while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-2xl bg-white/[0.06]", className)}
    />
  );
}

export function Row({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[22px] border border-hairline/60 bg-surface/60 px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
