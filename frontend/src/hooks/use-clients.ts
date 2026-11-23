"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchClients, updateClientNotes } from "@/lib/api/clients";
import { STALE_TIME } from "@/lib/query-config";
import type { AdminClientDTO, UpdateClientPayload } from "@/types/client";

export const clientKeys = {
  all: ["clients"] as const,
  list: () => [...clientKeys.all, "list"] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: fetchClients,
    staleTime: STALE_TIME.clients,
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
    // The response contains the saved note, so patch the cached client instead
    // of refetching the whole list with every appointment again.
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminClientDTO[]>(
        clientKeys.list(),
        (current) =>
          current?.map((client) =>
            client.id === updated.id
              ? { ...client, notes: updated.notes }
              : client
          )
      );
    },
  });
}
