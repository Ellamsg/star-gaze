"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearDayOverride,
  createBlock,
  deleteBlock,
  fetchAdminDay,
  fetchAdminMonth,
  fetchPublicDay,
  fetchPublicMonth,
  fetchScheduleSettings,
  saveDayOverride,
  saveScheduleSettings,
} from "@/lib/api/availability";
import { STALE_TIME } from "@/lib/query-config";
import type {
  CreateBlockPayload,
  DayOverridePayload,
  UpdateSchedulePayload,
} from "@/types/availability";

export const availabilityKeys = {
  all: ["availability"] as const,
  publicMonth: (month: string, duration: number) =>
    [...availabilityKeys.all, "public", "month", month, duration] as const,
  publicDay: (date: string, duration: number) =>
    [...availabilityKeys.all, "public", "day", date, duration] as const,
  adminMonth: (month: string) =>
    [...availabilityKeys.all, "admin", "month", month] as const,
  adminDay: (date: string) =>
    [...availabilityKeys.all, "admin", "day", date] as const,
  settings: () => [...availabilityKeys.all, "settings"] as const,
};

/* -------------------------------- public -------------------------------- */

export function usePublicMonth(month: string, duration: number) {
  return useQuery({
    queryKey: availabilityKeys.publicMonth(month, duration),
    queryFn: () => fetchPublicMonth(month, duration),
    enabled: Boolean(month),
    staleTime: STALE_TIME.openSlots,
  });
}

export function usePublicDay(date: string | null, duration: number) {
  return useQuery({
    queryKey: availabilityKeys.publicDay(date ?? "", duration),
    queryFn: () => fetchPublicDay(date!, duration),
    enabled: Boolean(date),
    staleTime: STALE_TIME.openSlots,
  });
}

/* --------------------------------- admin -------------------------------- */

export function useAdminDay(date: string | null) {
  return useQuery({
    queryKey: availabilityKeys.adminDay(date ?? ""),
    queryFn: () => fetchAdminDay(date!),
    enabled: Boolean(date),
    staleTime: STALE_TIME.availability,
  });
}

export function useAdminMonth(month: string) {
  return useQuery({
    queryKey: availabilityKeys.adminMonth(month),
    queryFn: () => fetchAdminMonth(month),
    enabled: Boolean(month),
    staleTime: STALE_TIME.availability,
  });
}

export function useScheduleSettings() {
  return useQuery({
    queryKey: availabilityKeys.settings(),
    queryFn: fetchScheduleSettings,
    staleTime: STALE_TIME.availability,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
}

export function useSaveSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSchedulePayload) => saveScheduleSettings(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useSaveDayOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      date,
      payload,
    }: {
      date: string;
      payload: DayOverridePayload;
    }) => saveDayOverride(date, payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useClearDayOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => clearDayOverride(date),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBlockPayload) => createBlock(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onSuccess: () => invalidate(queryClient),
  });
}
