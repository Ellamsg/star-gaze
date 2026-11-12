"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "@/lib/api/services";
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
  });
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}
