import { Router } from "express";

import { overview } from "../controllers/analytics.controller";
import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { overviewQuery } from "../validators/analytics.schema";

export const analyticsRouter = Router();

// Private studio numbers: signed-in admins with the analytics permission only.
analyticsRouter.get(
  "/overview",
  requireAuth,
  requirePermission("analytics:read"),
  validate({ query: overviewQuery }),
  asyncHandler(overview)
);
