import type { Request, Response } from "express";
import { createUploadSignature } from "../lib/cloudinary";

export async function signPhotoUpload(_req: Request, res: Response): Promise<void> {
  res.json({ data: createUploadSignature() });
}