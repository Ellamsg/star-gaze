import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  changePassword,
  login,
  logout,
  logoutAll,
  me,
} from "../controllers/auth.controller";
import { asyncHandler } from "../lib/async-handler";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  changePasswordSchema,
  loginSchema,
} from "../validators/auth.schema";

export const authRouter = Router();

/** Slow down password guessing without blocking a real admin for long. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Please try again later." },
});

authRouter.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(login)
);

authRouter.post("/logout", asyncHandler(logout));

authRouter.get("/me", requireAuth, asyncHandler(me));

authRouter.post(
  "/change-password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(changePassword)
);

authRouter.post("/logout-all", requireAuth, asyncHandler(logoutAll));
