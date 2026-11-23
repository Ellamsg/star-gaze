"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/lib/api/categories";
import { serviceKeys } from "@/hooks/use-services";
import { STALE_TIME } from "@/lib/query-config";
import type {
  CreateCategoryPayload,
  ListCategoriesParams,
  UpdateCategoryPayload,
} from "@/types/category";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params?: ListCategoriesParams) =>
    [...categoryKeys.all, params?.active ?? null] as const,
};

export function useCategories(params?: ListCategoriesParams) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => fetchCategories(params),
    staleTime: STALE_TIME.services,
  });
}

/** Service DTOs carry the category name, so refresh them after a rename. */
function invalidateCategoryViews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  void queryClient.invalidateQueries({ queryKey: serviceKeys.all });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => updateCategory(id, payload),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
}
