"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelDay,
  createSlots,
  deleteSlot,
  fetchAllSlots,
  fetchOpenSlots,
  setSlotStatus,
} from "@/lib/api/availability";
import { dayKey, todayKey } from "@/lib/date";
import type { CreateSlotsPayload } from "@/types/availability";

export const availabilityKeys = {
  all: ["availability"] as const,
  open: (from?: string, to?: string, minDuration?: number) =>
    [
      ...availabilityKeys.all,
      "open",
      from ?? null,
      to ?? null,
      minDuration ?? null,
    ] as const,
  list: (from?: string, to?: string) =>
    [...availabilityKeys.all, "all", from ?? null, to ?? null] as const,
};

/**
 * Public open slots for the booking page. When `from`/`to` are omitted the
 * dates are worked out inside the query function, so no `new Date()` runs
 * during the server render.
 */
export function useOpenSlots(
  from?: string,
  to?: string,
  minDuration?: number,
) {
  return useQuery({
    queryKey: availabilityKeys.open(from, to, minDuration),
    queryFn: () =>
      fetchOpenSlots(from ?? todayKey(), to ?? dayKey(60), minDuration),
  });
}

/** Admin slots (open + booked + blocked). */
export function useAllSlots(from?: string, to?: string, enabled = true) {
  return useQuery({
    queryKey: availabilityKeys.list(from, to),
    queryFn: () => fetchAllSlots(from ?? todayKey(), to ?? dayKey(30)),
    enabled,
  });
}

export function useCreateSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSlotsPayload) => createSlots(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all }),
  });
}

export function useSetSlotStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "OPEN" | "BLOCKED";
    }) => setSlotStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all }),
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSlot(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all }),
  });
}

export function useCancelDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => cancelDay(date),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all }),
  });
}
