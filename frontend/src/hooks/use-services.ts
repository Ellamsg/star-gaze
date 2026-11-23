"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "@/lib/api/services";
import { appointmentKeys } from "@/hooks/use-appointments";
import { clientKeys } from "@/hooks/use-clients";
import { STALE_TIME } from "@/lib/query-config";
import type {
  CreateServicePayload,
  ListServicesParams,
  UpdateServicePayload,
} from "@/types/service";

export const serviceKeys = {
  all: ["services"] as const,
  list: (params?: ListServicesParams) =>
    [
      ...serviceKeys.all,
      params?.active ?? null,
      params?.q ?? null,
    ] as const,
};

export function useServices(params?: ListServicesParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => fetchServices(params),
    staleTime: STALE_TIME.services,
  });
}

/** Service names, prices and durations are also shown in bookings and clients. */
function invalidateServiceViews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: serviceKeys.all });
  void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
  void queryClient.invalidateQueries({ queryKey: clientKeys.all });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateServicePayload) => createService(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateServicePayload;
    }) => updateService(id, payload),
    onSuccess: () => invalidateServiceViews(queryClient),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => invalidateServiceViews(queryClient),
  });
}
