import axios from "axios";

/**
 * Pre-configured Axios instance pointing at the backend API.
 * The base URL comes from the NEXT_PUBLIC_API_URL env variable
 * (set in .env.local → http://localhost:4000 for local dev).
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
  // The admin session lives in an HttpOnly cookie, never in localStorage.
  withCredentials: true,
  timeout: 10_000,
});

/** Response interceptor — unwrap errors into a readable message */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";

    // A protected request failed because the session expired or was revoked.
    // AuthGate listens for this and sends the admin back to the login page.
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/me")
    ) {
      window.dispatchEvent(new Event("admin:unauthorized"));
    }

    const message: string =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
