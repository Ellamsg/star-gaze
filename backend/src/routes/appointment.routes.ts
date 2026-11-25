import { Router } from "express";

import {
  cancelAppointment,
  cancelByToken,
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller";
import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  appointmentIdParam,
  cancelByTokenSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../validators/appointment.schema";

export const appointmentRouter = Router();

// Admin list — read-only, used by /admin/appointments.
appointmentRouter.get(
  "/",
  requireAuth,
  requirePermission("appointments:read"),
  asyncHandler(listAppointments)
);

appointmentRouter.post(
  "/",
  validate({ body: createAppointmentSchema }),
  asyncHandler(createAppointment)
);

appointmentRouter.post(
  "/cancel",
  validate({ body: cancelByTokenSchema }),
  asyncHandler(cancelByToken)
);

appointmentRouter.patch(
  "/:id/cancel",
  requireAuth,
  requirePermission("appointments:write"),
  validate({ params: appointmentIdParam }),
  asyncHandler(cancelAppointment)
);

appointmentRouter.patch(
  "/:id/status",
  requireAuth,
  requirePermission("appointments:write"),
  validate({
    params: appointmentIdParam,
    body: updateAppointmentStatusSchema,
  }),
  asyncHandler(updateAppointmentStatus)
);
