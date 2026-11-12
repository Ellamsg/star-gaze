"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  appointments as seedAppointments,
  clients as seedClients,
  notificationPrefs as seedNotifications,
  payments as seedPayments,
  refunds as seedRefunds,
  services as seedServices,
  staff as seedStaff,
  studioProfile as seedStudio,
  type AdminState,
  type AppointmentStatus,
  type Client,
  type NotificationPrefs,
  type PaymentStatus,
  type RefundStatus,
  type Role,
  type Service,
  type Staff,
  type StudioProfile,
} from "@/data/admin";

const STORAGE_KEY = "petal.admin.v1";

const seedState: AdminState = {
  services: seedServices,
  appointments: seedAppointments,
  clients: seedClients,
  staff: seedStaff,
  payments: seedPayments,
  refunds: seedRefunds,
  studio: seedStudio,
  notifications: seedNotifications,
};

export type Toast = {
  id: number;
  message: string;
  tone: "default" | "success" | "danger";
};

type NewService = Omit<Service, "id">;
type NewStaff = Omit<Staff, "id">;

type AdminContextValue = {
  state: AdminState;
  ready: boolean;
  toasts: Toast[];
  notify: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;

  addService: (input: NewService) => void;
  updateService: (id: string, patch: Partial<NewService>) => void;
  deleteService: (id: string) => { ok: boolean; message: string };

  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;

  addStaff: (input: NewStaff) => void;
  updateStaff: (id: string, patch: Partial<Omit<Staff, "id">>) => void;
  removeStaff: (id: string) => { ok: boolean; message: string };

  setPaymentStatus: (id: string, status: PaymentStatus) => void;
  createRefund: (paymentId: string, amount: number, reason: string) => void;
  setRefundStatus: (id: string, status: RefundStatus) => void;

  updateStudio: (patch: Partial<StudioProfile>) => void;
  updateNotifications: (patch: Partial<NotificationPrefs>) => void;
  resetDemo: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(seedState);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Load saved demo data after mount so server and client render the same HTML.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AdminState>;
        // Loading after mount keeps the server HTML and the first client render
        // identical; the saved copy swaps in on the next frame.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe localStorage load
        setState((current) => ({ ...current, ...saved }));
      }
    } catch {
      // Corrupt storage: keep the seed data.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota full (big photos) — the session still works, it just won't persist.
    }
  }, [state, ready]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, tone: Toast["tone"] = "default") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const addService = useCallback((input: NewService) => {
    setState((current) => ({
      ...current,
      services: [...current.services, { ...input, id: newId("s") }],
    }));
  }, []);

  const updateService = useCallback((id: string, patch: Partial<NewService>) => {
    setState((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === id ? { ...service, ...patch } : service
      ),
    }));
  }, []);

  const deleteService = useCallback(
    (id: string) => {
      const bookings = state.appointments.filter(
        (appointment) => appointment.serviceId === id
      ).length;

      if (bookings > 0) {
        return {
          ok: false,
          message: `This service is on ${bookings} booking${bookings === 1 ? "" : "s"}. Archive it instead — past appointments still need it.`,
        };
      }

      setState((current) => ({
        ...current,
        services: current.services.filter((service) => service.id !== id),
      }));

      return { ok: true, message: "Service deleted." };
    },
    [state.appointments]
  );

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setState((current) => {
      const nextState: AdminState = {
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === id ? { ...appointment, status } : appointment
        ),
      };

      if (status === "completed") {
        nextState.payments = current.payments.map((payment) =>
          payment.appointmentId === id &&
          (payment.status === "pending" || payment.status === "confirmed")
            ? { ...payment, status: "completed", paidAt: payment.paidAt ?? new Date().toISOString() }
            : payment
        );
      }

      return nextState;
    });
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setState((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === id ? { ...client, ...patch } : client
      ),
    }));
  }, []);

  const addStaff = useCallback((input: NewStaff) => {
    setState((current) => ({
      ...current,
      staff: [...current.staff, { ...input, id: newId("st") }],
    }));
  }, []);

  const updateStaff = useCallback((id: string, patch: Partial<Omit<Staff, "id">>) => {
    setState((current) => ({
      ...current,
      staff: current.staff.map((member) =>
        member.id === id ? { ...member, ...patch } : member
      ),
    }));
  }, []);

  const removeStaff = useCallback(
    (id: string) => {
      const member = state.staff.find((item) => item.id === id);

      if (!member) return { ok: false, message: "Team member not found." };
      if (member.role === "owner") {
        return { ok: false, message: "The owner account can't be removed." };
      }
      if (state.staff.filter((item) => item.active).length <= 1) {
        return { ok: false, message: "Keep at least one active admin." };
      }

      setState((current) => ({
        ...current,
        staff: current.staff.filter((item) => item.id !== id),
      }));

      return { ok: true, message: `${member.name} removed from the team.` };
    },
    [state.staff]
  );

  const setPaymentStatus = useCallback((id: string, status: PaymentStatus) => {
    setState((current) => ({
      ...current,
      payments: current.payments.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status,
              paidAt:
                status === "pending" || status === "failed"
                  ? undefined
                  : (payment.paidAt ?? new Date().toISOString()),
            }
          : payment
      ),
    }));
  }, []);

  const createRefund = useCallback((paymentId: string, amount: number, reason: string) => {
    setState((current) => {
      if (current.refunds.some((refund) => refund.paymentId === paymentId)) {
        return current;
      }

      return {
        ...current,
        refunds: [
          {
            id: newId("r"),
            paymentId,
            amount,
            reason,
            status: "requested",
            requestedAt: new Date().toISOString().slice(0, 10),
          },
          ...current.refunds,
        ],
      };
    });
  }, []);

  const setRefundStatus = useCallback((id: string, status: RefundStatus) => {
    setState((current) => {
      const refund = current.refunds.find((item) => item.id === id);

      return {
        ...current,
        refunds: current.refunds.map((item) => (item.id === id ? { ...item, status } : item)),
        payments:
          refund && status === "paid"
            ? current.payments.map((payment) =>
                payment.id === refund.paymentId ? { ...payment, status: "refunded" } : payment
              )
            : current.payments,
      };
    });
  }, []);

  const updateStudio = useCallback((patch: Partial<StudioProfile>) => {
    setState((current) => ({ ...current, studio: { ...current.studio, ...patch } }));
  }, []);

  const updateNotifications = useCallback((patch: Partial<NotificationPrefs>) => {
    setState((current) => ({
      ...current,
      notifications: { ...current.notifications, ...patch },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(seedState);
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      state,
      ready,
      toasts,
      notify,
      dismissToast,
      addService,
      updateService,
      deleteService,
      setAppointmentStatus,
      updateClient,
      addStaff,
      updateStaff,
      removeStaff,
      setPaymentStatus,
      createRefund,
      setRefundStatus,
      updateStudio,
      updateNotifications,
      resetDemo,
    }),
    [
      state,
      ready,
      toasts,
      notify,
      dismissToast,
      addService,
      updateService,
      deleteService,
      setAppointmentStatus,
      updateClient,
      addStaff,
      updateStaff,
      removeStaff,
      setPaymentStatus,
      createRefund,
      setRefundStatus,
      updateStudio,
      updateNotifications,
      resetDemo,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used inside <AdminProvider>.");
  }
  return context;
}

export function countByRole(staff: Staff[], role: Role): number {
  return staff.filter((member) => member.role === role).length;
}
