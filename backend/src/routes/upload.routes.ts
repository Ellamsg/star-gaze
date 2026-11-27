import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signPhotoUpload } from "../controllers/upload.controller";

export const uploadRouter = Router();

const signLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

uploadRouter.post("/sign", signLimiter, signPhotoUpload);