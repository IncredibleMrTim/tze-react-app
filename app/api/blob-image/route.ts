import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/**
 * Streams a private Blob image back to the browser. Private blobs require
 * the read-write token to fetch, so the browser can't load them directly
 * via <img src> — this route does that authenticated fetch server-side.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const result = await get(url, { access: "private" });

  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
