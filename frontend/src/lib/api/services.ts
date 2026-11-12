import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  CreateServicePayload,
  ListServicesParams,
  ServiceDTO,
  UpdateServicePayload,
} from "@/types/service";

/** GET /api/services — fetch all services (optionally filtered) */
export async function fetchServices(
  params?: ListServicesParams
): Promise<ServiceDTO[]> {
  const response = await apiClient.get<ApiResponse<ServiceDTO[]>>(
    "/api/services",
    { params }
  );
  return response.data.data;
}

/** GET /api/services/:id — fetch a single service by id or slug */
export async function fetchService(idOrSlug: string): Promise<ServiceDTO> {
  const response = await apiClient.get<ApiResponse<ServiceDTO>>(
    `/api/services/${idOrSlug}`
  );
  return response.data.data;
}

/** POST /api/services — create a new service */
export async function createService(
  payload: CreateServicePayload
): Promise<ServiceDTO> {
  const response = await apiClient.post<ApiResponse<ServiceDTO>>(
    "/api/services",
    payload
  );
  return response.data.data;
}

/** PUT /api/services/:id — update an existing service */
export async function updateService(
  id: string,
  payload: UpdateServicePayload
): Promise<ServiceDTO> {
  const response = await apiClient.put<ApiResponse<ServiceDTO>>(
    `/api/services/${id}`,
    payload
  );
  return response.data.data;
}

/** DELETE /api/services/:id — delete a service (fails if it has bookings) */
export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/api/services/${id}`);
}
