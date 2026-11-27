const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const MAX_PHOTOS = 3;
const MAX_BYTES = 8 * 1024 * 1024;

export type UploadedPhoto = {
  publicId: string;
  url: string;
  name: string;
};

export async function uploadPhoto(file: File): Promise<UploadedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That photo is over 8 MB. Please choose a smaller one.");
  }

  // 1 — get a signature from our API
  const signRes = await fetch(`${API_URL}/api/uploads/sign`, { method: "POST" });
  if (!signRes.ok) throw new Error("Could not start the upload. Try again.");
  const { data: sig } = await signRes.json();

  // 2 — upload straight to Cloudinary with exactly the signed params
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);


  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!upRes.ok) throw new Error("Upload failed. Please try again.");

  const result = await upRes.json();
  return { publicId: result.public_id, url: result.secure_url, name: file.name };
}

/** Small cropped thumbnail via Cloudinary's URL transformations. */
export function thumbUrl(url: string): string {
  return url.replace("/upload/", "/upload/c_fill,w_200,h_200,q_auto,f_auto/");
}