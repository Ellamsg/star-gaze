"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchClients, updateClientNotes } from "@/lib/api/clients";
import type { UpdateClientPayload } from "@/types/client";

export const clientKeys = {
  all: ["clients"] as const,
  list: () => [...clientKeys.all, "list"] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: fetchClients,
  });
}

export function useUpdateClientNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateClientPayload;
    }) => updateClientNotes(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}
