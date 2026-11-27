import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const PHOTO_FOLDER = "petal/appointments";
export const MAX_PHOTOS = 3;
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic";

/** Params the browser must send back to Cloudinary exactly as signed. */
export function createUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder: PHOTO_FOLDER,
    allowed_formats: ALLOWED_FORMATS,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    ...paramsToSign,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

export type VerifiedPhoto = { publicId: string; url: string };

/**
 * Confirms each public_id really exists in our folder on Cloudinary and
 * returns the URL Cloudinary reports, never one supplied by the client.
 */
export async function verifyPhotos(publicIds: string[]): Promise<VerifiedPhoto[]> {
  const unique = [...new Set(publicIds)];

  return Promise.all(
    unique.map(async (publicId) => {
      if (!publicId.startsWith(`${PHOTO_FOLDER}/`)) {
        throw new Error("INVALID_PHOTO");
      }
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: "image",
      });
      return { publicId: resource.public_id as string, url: resource.secure_url as string };
    }),
  );
}

export { cloudinary };