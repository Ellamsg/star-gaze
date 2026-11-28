import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminDayDTO,
  AvailabilityMonthDTO,
  CreateBlockPayload,
  DayOverridePayload,
  PublicDayDTO,
  ScheduleSettingsDTO,
  UpdateSchedulePayload,
} from "@/types/availability";

/* -------------------------------- public -------------------------------- */

export async function fetchPublicDay(
  date: string,
  duration: number
): Promise<PublicDayDTO> {
  const response = await apiClient.get<ApiResponse<PublicDayDTO>>(
    "/api/availability",
    { params: { date, duration } }
  );
  return response.data.data;
}

export async function fetchPublicMonth(
  month: string,
  duration: number
): Promise<AvailabilityMonthDTO> {
  const response = await apiClient.get<ApiResponse<AvailabilityMonthDTO>>(
    "/api/availability/month",
    { params: { month, duration } }
  );
  return response.data.data;
}

/* --------------------------------- admin -------------------------------- */

export async function fetchScheduleSettings(): Promise<ScheduleSettingsDTO> {
  const response = await apiClient.get<ApiResponse<ScheduleSettingsDTO>>(
    "/api/availability/admin/settings"
  );
  return response.data.data;
}

export async function saveScheduleSettings(
  payload: UpdateSchedulePayload
): Promise<ScheduleSettingsDTO> {
  const response = await apiClient.put<ApiResponse<ScheduleSettingsDTO>>(
    "/api/availability/admin/settings",
    payload
  );
  return response.data.data;
}

export async function fetchAdminMonth(
  month: string
): Promise<AvailabilityMonthDTO> {
  const response = await apiClient.get<ApiResponse<AvailabilityMonthDTO>>(
    "/api/availability/admin/month",
    { params: { month } }
  );
  return response.data.data;
}

export async function fetchAdminDay(date: string): Promise<AdminDayDTO> {
  const response = await apiClient.get<ApiResponse<AdminDayDTO>>(
    "/api/availability/admin/day",
    { params: { date } }
  );
  return response.data.data;
}

export async function saveDayOverride(
  date: string,
  payload: DayOverridePayload
): Promise<AdminDayDTO> {
  const response = await apiClient.put<ApiResponse<AdminDayDTO>>(
    "/api/availability/admin/day",
    payload,
    { params: { date } }
  );
  return response.data.data;
}

export async function clearDayOverride(date: string): Promise<AdminDayDTO> {
  const response = await apiClient.delete<ApiResponse<AdminDayDTO>>(
    "/api/availability/admin/day",
    { params: { date } }
  );
  return response.data.data;
}

export async function createBlock(
  payload: CreateBlockPayload
): Promise<AdminDayDTO> {
  const response = await apiClient.post<ApiResponse<AdminDayDTO>>(
    "/api/availability/admin/blocks",
    payload
  );
  return response.data.data;
}

export async function deleteBlock(id: string): Promise<AdminDayDTO> {
  const response = await apiClient.delete<ApiResponse<AdminDayDTO>>(
    `/api/availability/admin/blocks/${id}`
  );
  return response.data.data;
}
