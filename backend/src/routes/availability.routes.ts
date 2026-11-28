import { Router } from "express";

import {
  createBlock,
  deleteBlock,
  deleteDayOverride,
  getAdminDayHandler,
  getAdminMonth,
  getPublicDay,
  getPublicMonth,
  getSettings,
  updateSettings,
  upsertDayOverride,
} from "../controllers/availability.controller";
import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  adminDayQuery,
  adminMonthQuery,
  blockIdParam,
  createBlockSchema,
  dayOverrideSchema,
  overrideDateQuery,
  publicDayQuery,
  publicMonthQuery,
  scheduleSchema,
} from "../validators/availability.schema";

export const availabilityRouter = Router();

/* ------------------------------- public -------------------------------- */

// One date's open start times. The booking page calls this after a client
// has picked services, so the duration is known.
availabilityRouter.get(
  "/",
  validate({ query: publicDayQuery }),
  asyncHandler(getPublicDay)
);

// Month grid: which dates are open, full, closed or past.
availabilityRouter.get(
  "/month",
  validate({ query: publicMonthQuery }),
  asyncHandler(getPublicMonth)
);

/* -------------------------------- admin -------------------------------- */

availabilityRouter.get(
  "/admin/settings",
  requireAuth,
  requirePermission("availability:write"),
  asyncHandler(getSettings)
);

availabilityRouter.put(
  "/admin/settings",
  requireAuth,
  requirePermission("availability:write"),
  validate({ body: scheduleSchema }),
  asyncHandler(updateSettings)
);

availabilityRouter.get(
  "/admin/month",
  requireAuth,
  requirePermission("availability:write"),
  validate({ query: adminMonthQuery }),
  asyncHandler(getAdminMonth)
);

availabilityRouter.get(
  "/admin/day",
  requireAuth,
  requirePermission("availability:write"),
  validate({ query: adminDayQuery }),
  asyncHandler(getAdminDayHandler)
);

availabilityRouter.put(
  "/admin/day",
  requireAuth,
  requirePermission("availability:write"),
  validate({ query: overrideDateQuery, body: dayOverrideSchema }),
  asyncHandler(upsertDayOverride)
);

availabilityRouter.delete(
  "/admin/day",
  requireAuth,
  requirePermission("availability:write"),
  validate({ query: overrideDateQuery }),
  asyncHandler(deleteDayOverride)
);

availabilityRouter.post(
  "/admin/blocks",
  requireAuth,
  requirePermission("availability:write"),
  validate({ body: createBlockSchema }),
  asyncHandler(createBlock)
);

availabilityRouter.delete(
  "/admin/blocks/:id",
  requireAuth,
  requirePermission("availability:write"),
  validate({ params: blockIdParam }),
  asyncHandler(deleteBlock)
);
