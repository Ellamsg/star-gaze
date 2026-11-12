import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminAppointmentDTO,
  AppointmentApiStatus,
  AppointmentDTO,
  CreateAppointmentPayload,
} from "@/types/appointment";

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<AppointmentDTO> {
  const response = await apiClient.post<ApiResponse<AppointmentDTO>>(
    "/api/appointments",
    payload
  );
  return response.data.data;
}

/** GET /api/appointments — admin list with client, services and photos. */
export async function fetchAppointments(): Promise<AdminAppointmentDTO[]> {
  const response = await apiClient.get<ApiResponse<AdminAppointmentDTO[]>>(
    "/api/appointments"
  );
  return response.data.data;
}

export async function cancelAppointment(id: string): Promise<void> {
  await apiClient.patch(`/api/appointments/${id}/cancel`);
}

/** PATCH /api/appointments/:id/status — confirm / complete / reopen. */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentApiStatus
): Promise<void> {
  await apiClient.patch(`/api/appointments/${id}/status`, { status });
}

export async function cancelByToken(token: string): Promise<void> {
  await apiClient.post("/api/appointments/cancel", { token });
}
