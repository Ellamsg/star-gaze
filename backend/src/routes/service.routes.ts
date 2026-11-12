import { Router } from "express";

import {
  createService,
  deleteService,
  getService,
  listServices,
  updateService,
} from  "../controllers/service.controller";



import { asyncHandler } from "../lib/async-handler";
import { validate } from "../middleware/validate";
import {
  createServiceSchema,
  listServicesQuery,
  serviceIdParam,
  updateServiceSchema,
} from "../validators/service.schema";

export const serviceRouter = Router();

// Public reads — the client-facing site needs the catalogue.
serviceRouter.get("/", validate({ query: listServicesQuery }), asyncHandler(listServices));
serviceRouter.get("/:id", validate({ params: serviceIdParam }), asyncHandler(getService));

/*

 */
serviceRouter.post(
  "/",
  validate({ body: createServiceSchema }),
  asyncHandler(createService)
);
serviceRouter.put(
  "/:id",
  validate({ params: serviceIdParam, body: updateServiceSchema }),
  asyncHandler(updateService)
);
serviceRouter.delete(
  "/:id",
  validate({ params: serviceIdParam }),
  asyncHandler(deleteService)
);