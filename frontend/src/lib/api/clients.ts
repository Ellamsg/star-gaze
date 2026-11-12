import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminClientDTO,
  UpdateClientPayload,
} from "@/types/client";

/** GET /api/clients — clients with their full booking history. */
export async function fetchClients(): Promise<AdminClientDTO[]> {
  const response = await apiClient.get<ApiResponse<AdminClientDTO[]>>(
    "/api/clients"
  );
  return response.data.data;
}

/** PATCH /api/clients/:id — admin note editing. */
export async function updateClientNotes(
  id: string,
  payload: UpdateClientPayload
): Promise<{ id: string; notes: string | null }> {
  const response = await apiClient.patch<
    ApiResponse<{ id: string; notes: string | null }>
  >(`/api/clients/${id}`, payload);
  return response.data.data;
}
