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
  timeout: 10_000,
});

/** Response interceptor — unwrap errors into a readable message */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
