// src/app/api/blob/upload/route.js
import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

// Optional but recommended: run this on the Edge runtime for lower latency
export const runtime = "edge";

export async function POST(request) {
  try {
    // The body comes from `upload(..., { handleUploadUrl: '/api/blob/upload', clientPayload: {...} })`
    const body = await request.json();

    // Delegate token generation + (optional) webhook handling to Vercel Blob
    const json = await handleUpload({
      body,
      request,

      // Gatekeeping before issuing a client upload token
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // NOTE: Your client already builds a safe, timestamped path like:
        // `dance-verse/<safeName>-<safeEmail>-<ISO>.mp4`
        // We keep that path; just enforce constraints.

        // Validate the optional clientPayload from your form (type/size).
        // Depending on SDK version, this may arrive as stringified JSON.
        let payload = clientPayload;
        if (typeof payload === "string") {
          try { payload = JSON.parse(payload); } catch { /* ignore */ }
        }

        const claimedSize = Number(payload?.size ?? 0);
        const claimedType = String(payload?.type ?? "");

        // Basic allow-list for video uploads
        const allowedContentTypes = [
          "video/mp4",
          "video/quicktime", // .mov
          "video/webm",
          "video/*",
        ];

        // If client lied about type/size, the upstream check below still protects,
        // but we can short-circuit obvious bad requests here too.
        const MAX_BYTES = 45 * 1024 * 1024; // 45MB

        if (claimedSize && claimedSize > MAX_BYTES) {
          throw new Error("File exceeds 45MB limit");
        }

        // Return token rules for Vercel Blob
        return {
          // Your client generates unique names already; no random suffix needed
          addRandomSuffix: false,

          // Hard enforce size/type at the storage edge
          maximumSizeInBytes: MAX_BYTES,
          allowedContentTypes,

          // Optional: prevent accidental overwrites of same pathname
          allowOverwrite: false,

          // Optional: shorter expiry (defaults to ~1h). E.g., 10 minutes
          // validUntil: Date.now() + 10 * 60 * 1000,

          // If you want to receive the payload back in onUploadCompleted:
          tokenPayload: JSON.stringify({
            type: claimedType,
            size: claimedSize,
          }),
        };
      },

      // Webhook-like callback when the browser finishes uploading to Blob.
      // (Won't trigger on localhost without a public URL.)
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // You’re already persisting metadata client-side via /api/save-submission,
        // so we just log here. If you ever want server-side persistence, you can
        // call your DB from here safely.
        try {
          const payload = (() => {
            try { return JSON.parse(tokenPayload || "{}"); } catch { return {}; }
          })();

          console.log("🎉 Blob upload complete:", {
            url: blob?.url,
            pathname: blob?.pathname,
            size: blob?.size,
            contentType: blob?.contentType,
            payload,
          });
        } catch (e) {
          // If this throws, Vercel will retry the callback a few times unless we return 200
          console.error("onUploadCompleted error:", e);
          throw e;
        }
      },
    });

    // Return the token/fields the client needs to complete the direct upload
    return NextResponse.json(json);
  } catch (err) {
    // If we return a non-2xx here, the SDK on the client will surface an error
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
