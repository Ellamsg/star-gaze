import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AvailabilitySlotDTO,
  CancelDayResult,
  CreateSlotsPayload,
  CreateSlotsResult,
} from "@/types/availability";

/** Public: open slots only. */
export async function fetchOpenSlots(
  from: string,
  to: string,
  minDuration?: number
): Promise<AvailabilitySlotDTO[]> {
  const response = await apiClient.get<ApiResponse<AvailabilitySlotDTO[]>>(
    "/api/availability",
    { params: { from, to, minDuration } }
  );
  return response.data.data;
}

/** Admin: all slots, including booked and blocked. */
export async function fetchAllSlots(
  from: string,
  to: string
): Promise<AvailabilitySlotDTO[]> {
  const response = await apiClient.get<ApiResponse<AvailabilitySlotDTO[]>>(
    "/api/availability/all",
    { params: { from, to } }
  );
  return response.data.data;
}

export async function createSlots(
  payload: CreateSlotsPayload
): Promise<CreateSlotsResult> {
  const response = await apiClient.post<ApiResponse<CreateSlotsResult>>(
    "/api/availability",
    payload
  );
  return response.data.data;
}

export async function setSlotStatus(
  id: string,
  status: "OPEN" | "BLOCKED"
): Promise<AvailabilitySlotDTO> {
  const response = await apiClient.patch<ApiResponse<AvailabilitySlotDTO>>(
    `/api/availability/${id}`,
    { status }
  );
  return response.data.data;
}

export async function deleteSlot(id: string): Promise<void> {
  await apiClient.delete(`/api/availability/${id}`);
}

export async function cancelDay(date: string): Promise<CancelDayResult> {
  const response = await apiClient.post<ApiResponse<CancelDayResult>>(
    "/api/availability/cancel-day",
    { date }
  );
  return response.data.data;
}
