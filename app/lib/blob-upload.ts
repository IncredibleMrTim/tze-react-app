import { upload } from "@vercel/blob/client";

/**
 * Upload a compressed image (data URL or File) to Vercel Blob via the client
 * upload flow, so image bytes never pass through a server function payload.
 */
export async function uploadImageToBlob(
  image: string | File,
  pathname: string,
): Promise<string> {
  const body = typeof image === "string" ? await (await fetch(image)).blob() : image;

  const blob = await upload(pathname, body, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });

  return blob.url;
}

/**
 * Fetch a Blob-stored image back down and re-encode it as a base64 data URL.
 * Used where we still need raw bytes client-side (e.g. sending to Claude for OCR).
 */
export async function blobUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
