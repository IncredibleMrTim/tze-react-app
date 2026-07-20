import { NextRequest, NextResponse } from "next/server";
import { getSignedBlobUrl } from "@/lib/blob-signed-url";

/**
 * Redirects to a short-lived presigned URL for a private Blob image, so the
 * browser fetches bytes directly from the Blob CDN instead of streaming them
 * through this server.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const signedUrl = await getSignedBlobUrl(url);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Failed to sign blob URL:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
