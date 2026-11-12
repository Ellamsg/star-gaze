import { Router } from "express";

import { listClients, updateClient } from "../controllers/client.controller";
import { asyncHandler } from "../lib/async-handler";
import { validate } from "../middleware/validate";
import { clientIdParam, updateClientSchema } from "../validators/client.schema";

export const clientRouter = Router();

// Admin reads: client list with each client's booking history.
clientRouter.get("/", asyncHandler(listClients));

clientRouter.patch(
  "/:id",
  validate({ params: clientIdParam, body: updateClientSchema }),
  asyncHandler(updateClient)
);
