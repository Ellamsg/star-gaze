import axios from "axios";

import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminDTO,
  ChangePasswordPayload,
  LoginPayload,
} from "@/types/auth";

/** POST /api/auth/login — the server sets the HttpOnly session cookie. */
export async function login(payload: LoginPayload): Promise<AdminDTO> {
  const response = await apiClient.post<ApiResponse<AdminDTO>>(
    "/api/auth/login",
    payload
  );
  return response.data.data;
}

/** GET /api/auth/me — null means "not signed in", not a network failure. */
export async function fetchMe(): Promise<AdminDTO | null> {
  try {
    const response = await apiClient.get<ApiResponse<AdminDTO>>("/api/auth/me");
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

/** POST /api/auth/logout — revokes this session and clears the cookie. */
export async function logout(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

/** POST /api/auth/logout-all — revokes every session for this admin. */
export async function logoutAll(): Promise<void> {
  await apiClient.post("/api/auth/logout-all");
}

/** POST /api/auth/change-password — current password is required. */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<AdminDTO> {
  const response = await apiClient.post<ApiResponse<AdminDTO>>(
    "/api/auth/change-password",
    payload
  );
  return response.data.data;
}
