"use client";

import { useMemo, useState } from "react";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Money,
  PageHeader,
  PaymentBadge,
  RefundBadge,
  Segmented,
  Select,
  Sheet,
  StatCard,
  TextInput,
  Textarea,
} from "@/components/admin/ui";
import {
  clientById,
  paymentMethodLabels,
  serviceById,
  type Payment,
  type PaymentStatus,
} from "@/data/admin";
import { formatDate, formatMonth, formatTime } from "@/lib/date";

type Filter = "all" | PaymentStatus;

export default function PaymentsPage() {
  const { state, setPaymentStatus, createRefund, notify } = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [month, setMonth] = useState("all");
  const [day, setDay] = useState("all");
  const [refunding, setRefunding] = useState<Payment | null>(null);

  const months = useMemo(
    () => Array.from(new Set(state.payments.map((payment) => payment.date.slice(0, 7)))).sort().reverse(),
    [state.payments]
  );

  const days = useMemo(
    () =>
      Array.from(
        new Set(
          state.payments
            .filter((payment) => month === "all" || payment.date.startsWith(month))
            .map((payment) => payment.date.slice(8, 10))
        )
      ).sort(),
    [state.payments, month]
  );

  const filtered = useMemo(() => {
    return state.payments
      .filter((payment) => {
        if (filter !== "all" && payment.status !== filter) return false;
        if (month !== "all" && !payment.date.startsWith(month)) return false;
        if (day !== "all" && payment.date.slice(8, 10) !== day) return false;
        return true;
      })
      .sort((a, b) => {
        // Anything still pending comes first — that's the money that needs a nudge.
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return b.date.localeCompare(a.date);
      });
  }, [state.payments, filter, month, day]);

  const collected = filtered
    .filter((payment) => payment.status === "confirmed" || payment.status === "completed")
    .reduce((total, payment) => total + payment.amount, 0);
  const pending = filtered
    .filter((payment) => payment.status === "pending")
    .reduce((total, payment) => total + payment.amount, 0);
  const refunded = filtered
    .filter((payment) => payment.status === "refunded")
    .reduce((total, payment) => total + payment.amount, 0);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: state.payments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      refunded: 0,
      failed: 0,
    };
    for (const payment of state.payments) base[payment.status] += 1;
    return base;
  }, [state.payments]);

  const confirmPayment = (payment: Payment) => {
    setPaymentStatus(payment.id, "confirmed");
    notify(`Payment ${payment.id.toUpperCase()} confirmed.`, "success");
  };

  const completePayment = (payment: Payment) => {
    setPaymentStatus(payment.id, "completed");
    notify(`Payment ${payment.id.toUpperCase()} completed.`, "success");
  };

  return (
    <div>
      <PageHeader
        eyebrow="The money"
        title="Payments"
        accent="& takings"
        description="Pending, confirmed, completed — and what came back. Filter by month or day to match a bank statement."
        action={
          <a
            href="/admin/refunds"
            className="hidden h-10 items-center gap-2 rounded-full border border-hairline/80 bg-white/[0.04] px-4 text-[13px] text-cream sm:inline-flex"
          >
            <Icon name="refund" size={15} /> Refunds
          </a>
        }
      />

      <div className="no-scrollbar -mx-4 mb-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        <StatCard accent label="Collected" value={`₦${collected.toLocaleString("en-NG")}`} hint="Confirmed + completed" icon="wallet" />
        <StatCard label="Pending" value={`₦${pending.toLocaleString("en-NG")}`} hint="Waiting to land" icon="clock" />
        <StatCard label="Refunded" value={`₦${refunded.toLocaleString("en-NG")}`} hint="Money returned" icon="refund" />
      </div>

      <div className="space-y-3">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "confirmed", label: "Confirmed", count: counts.confirmed },
            { value: "completed", label: "Completed", count: counts.completed },
            { value: "refunded", label: "Refunded", count: counts.refunded },
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
              setDay("all");
            }}
            aria-label="Filter by month"
          >
            <option value="all">All months</option>
            {months.map((value) => (
              <option key={value} value={value}>
                {formatMonth(value)}
              </option>
            ))}
          </Select>
          <Select value={day} onChange={(event) => setDay(event.target.value)} aria-label="Filter by day">
            <option value="all">All days</option>
            {days.map((value) => (
              <option key={value} value={value}>
                Day {Number(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        {filtered.length} payment{filtered.length === 1 ? "" : "s"}
        {filter !== "all" ? ` · ${filter}` : ""}
        {month !== "all" ? ` · ${formatMonth(month)}` : ""}
        {day !== "all" ? ` · day ${Number(day)}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon="wallet"
            title="Nothing here"
            body="No payments match these filters. Try another month or status."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFilter("all");
                  setMonth("all");
                  setDay("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((payment) => {
            const appointment = state.appointments.find((item) => item.id === payment.appointmentId);
            const client = appointment ? clientById(state, appointment.clientId) : undefined;
            const service = appointment ? serviceById(state, appointment.serviceId) : undefined;
            const existingRefund = state.refunds.find((refund) => refund.paymentId === payment.id);

            return (
              <li key={payment.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-[14px] font-medium leading-snug text-cream">
                        {client?.name ?? "Guest"}
                      </p>
                      <p className="break-words text-[12px] text-muted">
                        {service?.name} · {paymentMethodLabels[payment.method]}
                      </p>
                      <p className="mt-1 text-[11px] text-muted/80">
                        {appointment ? `${formatDate(appointment.date)} · ${formatTime(appointment.time)}` : "—"} ·{" "}
                        {payment.id.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg leading-none text-cream">
                        <Money value={payment.amount} />
                      </p>
                      <div className="mt-1.5 flex justify-end">
                        <PaymentBadge status={payment.status} />
                      </div>
                    </div>
                  </div>

                  {payment.status === "pending" || payment.status === "confirmed" ? (
                    <div className="mt-3 flex gap-2 border-t border-hairline/50 pt-3">
                      {payment.status === "pending" ? (
                        <Button size="sm" icon="check" onClick={() => confirmPayment(payment)}>
                          Confirm payment
                        </Button>
                      ) : null}
                      {payment.status === "confirmed" ? (
                        <Button size="sm" icon="check" onClick={() => completePayment(payment)}>
                          Mark completed
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {payment.status === "completed" ? (
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/50 pt-3">
                      <span className="text-[11px] text-muted">
                        {existingRefund ? "Refund on file" : "Something went wrong with this one?"}
                      </span>
                      {existingRefund ? (
                        <RefundBadge status={existingRefund.status} />
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setRefunding(payment)}>
                          Start refund
                        </Button>
                      )}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={refunding !== null}
        onClose={() => setRefunding(null)}
        title="Start a refund"
        description="The request goes to the Refunds page for approval before any money moves."
      >
        {refunding ? (
          <RefundForm
            payment={refunding}
            onSubmit={(amount, reason) => {
              createRefund(refunding.id, amount, reason);
              setRefunding(null);
              notify("Refund request created.", "success");
            }}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function RefundForm({
  payment,
  onSubmit,
}: {
  payment: Payment;
  onSubmit: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState(`${payment.amount}`);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (value > payment.amount) {
      setError(`You can't refund more than the ${payment.amount.toLocaleString("en-NG")} paid.`);
      return;
    }
    if (reason.trim().length < 4) {
      setError("Add a short reason — future-you will want it.");
      return;
    }
    setError(null);
    onSubmit(value, reason.trim());
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-hairline/60 bg-canvas/30 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted">Paid</p>
        <p className="mt-0.5 font-display text-xl text-cream">
          <Money value={payment.amount} />
        </p>
      </div>

      <Field label="Refund amount (₦)" hint={`Maximum ₦${payment.amount.toLocaleString("en-NG")}`}>
        <TextInput
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
        />
      </Field>

      <Field label="Reason">
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Set loosened within 48 hours"
        />
      </Field>

      {error ? (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          {error}
        </p>
      ) : null}

      <Button className="w-full" icon="refund" onClick={submit}>
        Create refund request
      </Button>
    </div>
  );
}
