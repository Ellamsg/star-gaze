import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { asyncHandler } from "../lib/async-handler";
import { validate } from "../middleware/validate";
import {
  categoryIdParam,
  createCategorySchema,
  listCategoriesQuery,
  updateCategorySchema,
} from "../validators/category.schema";

export const categoryRouter = Router();

// Public reads — the booking page renders one tab per category.
categoryRouter.get(
  "/",
  validate({ query: listCategoriesQuery }),
  asyncHandler(listCategories)
);
categoryRouter.get(
  "/:id",
  validate({ params: categoryIdParam }),
  asyncHandler(getCategory)
);

// Admin writes.
categoryRouter.post(
  "/",
  validate({ body: createCategorySchema }),
  asyncHandler(createCategory)
);
categoryRouter.put(
  "/:id",
  validate({ params: categoryIdParam, body: updateCategorySchema }),
  asyncHandler(updateCategory)
);
categoryRouter.delete(
  "/:id",
  validate({ params: categoryIdParam }),
  asyncHandler(deleteCategory)
);
