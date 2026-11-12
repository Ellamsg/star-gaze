/** Standard success envelope from the API. */
export type ApiResponse<T> = {
  data: T;
};

/** Standard error envelope from the API. */
export type ApiError = {
  error?: string;
  message?: string;
  details?: unknown;
};
