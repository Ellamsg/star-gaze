/** Shape returned by GET /api/categories and GET /api/categories/:id */
export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  servicesCount: number;
};

/** Body sent to POST /api/categories */
export type CreateCategoryPayload = {
  name: string;
  /** Optional — auto-generated from name if omitted */
  slug?: string;
  sortOrder?: number;
  active?: boolean;
};

/** Body sent to PUT /api/categories/:id — all fields optional but at least one required */
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

/** Query params for GET /api/categories */
export type ListCategoriesParams = {
  active?: boolean;
};

/** Values managed by react-hook-form when adding a category. */
export type CategoryFormValues = {
  name: string;
};
