import { Router } from "express";

import {
  cancelDay,
  createSlots,
  deleteSlot,
  listAllSlots,
  listOpenSlots,
  updateSlot,
} from "../controllers/availability.controller";
import { asyncHandler } from "../lib/async-handler";
import { validate } from "../middleware/validate";
import {
  cancelDaySchema,
  createSlotsSchema,
  listSlotsQuery,
  slotIdParam,
  updateSlotSchema,
} from "../validators/availability.schema";

export const availabilityRouter = Router();

// Public — what the booking page reads.
availabilityRouter.get(
  "/",
  validate({ query: listSlotsQuery }),
  asyncHandler(listOpenSlots)
);

// Admin — everything, including booked + blocked.
availabilityRouter.get(
  "/all",
  validate({ query: listSlotsQuery }),
  asyncHandler(listAllSlots)
);

availabilityRouter.post(
  "/",
  validate({ body: createSlotsSchema }),
  asyncHandler(createSlots)
);

availabilityRouter.post(
  "/cancel-day",
  validate({ body: cancelDaySchema }),
  asyncHandler(cancelDay)
);

availabilityRouter.patch(
  "/:id",
  validate({ params: slotIdParam, body: updateSlotSchema }),
  asyncHandler(updateSlot)
);

availabilityRouter.delete(
  "/:id",
  validate({ params: slotIdParam }),
  asyncHandler(deleteSlot)
);
