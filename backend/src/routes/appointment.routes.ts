import { Router } from "express";

import {
  cancelAppointment,
  cancelByToken,
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller";
import { asyncHandler } from "../lib/async-handler";
import { validate } from "../middleware/validate";
import {
  appointmentIdParam,
  cancelByTokenSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../validators/appointment.schema";

export const appointmentRouter = Router();

// Admin list — read-only, used by /admin/appointments.
appointmentRouter.get("/", asyncHandler(listAppointments));

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
  validate({ params: appointmentIdParam }),
  asyncHandler(cancelAppointment)
);

appointmentRouter.patch(
  "/:id/status",
  validate({
    params: appointmentIdParam,
    body: updateAppointmentStatusSchema,
  }),
  asyncHandler(updateAppointmentStatus)
);
