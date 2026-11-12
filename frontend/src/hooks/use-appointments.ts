"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelAppointment,
  cancelByToken,
  createAppointment,
  fetchAppointments,
  updateAppointmentStatus,
} from "@/lib/api/appointments";
import { availabilityKeys } from "@/hooks/use-availability";
import type {
  AppointmentApiStatus,
  CreateAppointmentPayload,
} from "@/types/appointment";

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: () => [...appointmentKeys.all, "list"] as const,
};

/** Admin list, straight from the database. */
export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: fetchAppointments,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      createAppointment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
    // A 409 means someone else took the slot, so refresh the list too.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all }),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useCancelByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => cancelByToken(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
