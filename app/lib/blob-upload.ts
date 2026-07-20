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
  const bypassToken = process.env.NEXT_PUBLIC_WS_PROTECTION_BYPASS;

  const blob = await upload(pathname, body, {
    access: "private",
    handleUploadUrl: "/api/upload",
    headers: bypassToken ? { "x-vercel-protection-bypass": bypassToken } : undefined,
  });

  return blob.url;
}

/**
 * Build the URL to fetch a private Blob-stored image through our own
 * authenticated proxy route, since private blob URLs aren't fetchable
 * directly from the browser.
 */
export function toBlobProxyUrl(blobUrl: string): string {
  return `/api/blob-image?url=${encodeURIComponent(blobUrl)}`;
}

/**
 * Build the URL to fetch a private Blob-stored image via a short-lived
 * presigned URL, redirecting the browser straight to the Blob CDN instead of
 * streaming bytes through our own server.
 */
export function toSignedImageUrl(blobUrl: string): string {
  return `/api/blob-signed-image?url=${encodeURIComponent(blobUrl)}`;
}

/**
 * Fetch a Blob-stored image back down and re-encode it as a base64 data URL.
 * Used where we still need raw bytes client-side (e.g. sending to Claude for OCR).
 */
export async function blobUrlToBase64(url: string): Promise<string> {
  const response = await fetch(toBlobProxyUrl(url));
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
