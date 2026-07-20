import { issueSignedToken, presignUrl } from "@vercel/blob";

const SIGNED_URL_TTL_MS = 60 * 60 * 1000;

/**
 * Exchange a stored private-Blob URL for a short-lived presigned URL the
 * browser can fetch directly from the Blob CDN, without proxying bytes
 * through our own server.
 */
export async function getSignedBlobUrl(blobUrl: string): Promise<string> {
  const pathname = new URL(blobUrl).pathname.slice(1);

  const signedToken = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil: Date.now() + SIGNED_URL_TTL_MS,
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname,
    access: "private",
  });

  return presignedUrl;
}
