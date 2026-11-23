import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  CategoryDTO,
  CreateCategoryPayload,
  ListCategoriesParams,
  UpdateCategoryPayload,
} from "@/types/category";

/** GET /api/categories — all service categories (optionally filtered) */
export async function fetchCategories(
  params?: ListCategoriesParams
): Promise<CategoryDTO[]> {
  const response = await apiClient.get<ApiResponse<CategoryDTO[]>>(
    "/api/categories",
    { params }
  );
  return response.data.data;
}

/** GET /api/categories/:id — a single category by id or slug */
export async function fetchCategory(idOrSlug: string): Promise<CategoryDTO> {
  const response = await apiClient.get<ApiResponse<CategoryDTO>>(
    `/api/categories/${idOrSlug}`
  );
  return response.data.data;
}

/** POST /api/categories — create a category */
export async function createCategory(
  payload: CreateCategoryPayload
): Promise<CategoryDTO> {
  const response = await apiClient.post<ApiResponse<CategoryDTO>>(
    "/api/categories",
    payload
  );
  return response.data.data;
}

/** PUT /api/categories/:id — rename or reorder a category */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<CategoryDTO> {
  const response = await apiClient.put<ApiResponse<CategoryDTO>>(
    `/api/categories/${id}`,
    payload
  );
  return response.data.data;
}

/** DELETE /api/categories/:id — fails while services still use it */
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`);
}
