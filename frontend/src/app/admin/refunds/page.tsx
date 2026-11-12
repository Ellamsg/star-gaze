"use client";

import { useMemo, useState } from "react";

import { useAdmin } from "@/components/admin/store";
import { Icon } from "@/components/admin/icons";
import {
  Button,
  Card,
  EmptyState,
  Money,
  PageHeader,
  PaymentBadge,
  RefundBadge,
  Segmented,
  StatCard,
} from "@/components/admin/ui";
import { clientById, type RefundStatus } from "@/data/admin";
import { formatDate } from "@/lib/date";

type Filter = "all" | RefundStatus;

export default function RefundsPage() {
  const { state, setRefundStatus, notify } = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: state.refunds.length,
      requested: 0,
      approved: 0,
      paid: 0,
      declined: 0,
    };
    for (const refund of state.refunds) base[refund.status] += 1;
    return base;
  }, [state.refunds]);

  const visible = state.refunds
    .filter((refund) => filter === "all" || refund.status === filter)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const requestedTotal = state.refunds
    .filter((refund) => refund.status === "requested")
    .reduce((total, refund) => total + refund.amount, 0);
  const approvedTotal = state.refunds
    .filter((refund) => refund.status === "approved")
    .reduce((total, refund) => total + refund.amount, 0);
  const paidTotal = state.refunds
    .filter((refund) => refund.status === "paid")
    .reduce((total, refund) => total + refund.amount, 0);

  const move = (id: string, status: RefundStatus) => {
    setRefundStatus(id, status);
    notify(`Refund marked ${status}.`, status === "declined" ? "danger" : "success");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Money back"
        title="Refunds"
        accent="& goodwill"
        description="Approve, decline or settle. Marking one paid also flips the original payment to Refunded."
      />

      <div className="no-scrollbar -mx-4 mb-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        <StatCard accent label="Requested" value={`₦${requestedTotal.toLocaleString("en-NG")}`} hint="Needs a decision" icon="clock" />
        <StatCard label="Approved" value={`₦${approvedTotal.toLocaleString("en-NG")}`} hint="Ready to pay out" icon="check" />
        <StatCard label="Paid out" value={`₦${paidTotal.toLocaleString("en-NG")}`} hint="All time" icon="refund" />
      </div>

      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "requested", label: "Requested", count: counts.requested },
          { value: "approved", label: "Approved", count: counts.approved },
          { value: "paid", label: "Paid", count: counts.paid },
          { value: "declined", label: "Declined", count: counts.declined },
        ]}
        className="mb-4"
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="refund"
          title="No refunds here"
          body="Refunds started from a completed payment will show up in this list."
        />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((refund) => {
            const payment = state.payments.find((item) => item.id === refund.paymentId);
            const appointment = payment
              ? state.appointments.find((item) => item.id === payment.appointmentId)
              : undefined;
            const client = appointment ? clientById(state, appointment.clientId) : undefined;

            return (
              <li key={refund.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-[14px] font-medium leading-snug text-cream">
                        {client?.name ?? "Guest"}
                      </p>
                      <p className="text-[11px] text-muted/80">
                        {refund.id.toUpperCase()} · requested {formatDate(refund.requestedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg leading-none text-cream">
                        <Money value={refund.amount} />
                      </p>
                      <div className="mt-1.5 flex justify-end">
                        <RefundBadge status={refund.status} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-hairline/60 bg-canvas/30 px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85">
                    {refund.reason}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <Icon name="wallet" size={12} />
                      Payment {payment?.id.toUpperCase() ?? "—"}
                    </span>
                    {payment ? <PaymentBadge status={payment.status} /> : null}
                  </div>

                  {refund.status === "requested" ? (
                    <div className="mt-3 flex gap-2 border-t border-hairline/50 pt-3">
                      <Button size="sm" icon="check" onClick={() => move(refund.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => move(refund.id, "declined")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : null}

                  {refund.status === "approved" ? (
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/50 pt-3">
                      <span className="text-[11px] text-muted">Paid the client back already?</span>
                      <Button size="sm" onClick={() => move(refund.id, "paid")}>
                        Mark paid
                      </Button>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
