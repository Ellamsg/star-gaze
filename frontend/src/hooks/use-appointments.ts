"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  cancelAppointment,
  cancelByToken,
  createAppointment,
  fetchAppointments,
  updateAppointmentStatus,
} from "@/lib/api/appointments";
import { availabilityKeys } from "@/hooks/use-availability";
import { clientKeys } from "@/hooks/use-clients";
import { STALE_TIME } from "@/lib/query-config";
import type {
  AppointmentApiStatus,
  CreateAppointmentPayload,
} from "@/types/appointment";

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: () => [...appointmentKeys.all, "list"] as const,
};

/** A booking change affects the booking list, free slots and client history. */
function invalidateAppointmentViews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
  void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
  void queryClient.invalidateQueries({ queryKey: clientKeys.all });
}

/** Admin list, straight from the database. */
export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: fetchAppointments,
    staleTime: STALE_TIME.appointments,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      createAppointment(payload),
    onSuccess: () => invalidateAppointmentViews(queryClient),
    // A 409 means someone else took the slot, so refresh both views.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentApiStatus;
    }) => updateAppointmentStatus(id, status),
    onSuccess: () => invalidateAppointmentViews(queryClient),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => invalidateAppointmentViews(queryClient),
  });
}

export function useCancelByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => cancelByToken(token),
    onSuccess: () => invalidateAppointmentViews(queryClient),
  });
}
