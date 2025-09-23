// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/supabase";
import {
  formatFileSize,
  isEmail,
  isPhone,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/utils/uploadHelpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const payload = await req.json();
    const {
      name = "",
      email = "",
      phone = "",
      title = "",
      filename = "",
      fileSize,
      fileType = "",
      publicUrl = "",
      storagePath = "",
    } = payload || {};

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedTitle = String(title).trim();
    const effectiveFilename = String(filename || storagePath).trim();
    const sizeNumber = Number(fileSize);

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedTitle) {
      return NextResponse.json(
        { error: "All fields (name, email, phone, title) are required" },
        { status: 400 }
      );
    }

    if (!isEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!isPhone(trimmedPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (!effectiveFilename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
      return NextResponse.json({ error: "File size is required" }, { status: 400 });
    }

    if (sizeNumber > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${formatFileSize(sizeNumber)}) exceeds the 45MB limit.`,
        },
        { status: 413 }
      );
    }

    if (!String(fileType || "").startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }

    if (!publicUrl) {
      return NextResponse.json({ error: "Missing Supabase public URL" }, { status: 400 });
    }

    const submissionData = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      title: trimmedTitle,
      filename: effectiveFilename,
      blob_url: publicUrl,
      download_url: publicUrl,
      file_size: sizeNumber,
      file_type: fileType,
      storage_location: "supabase",
      vps_file_id: null,
    };

    const submission = await saveSubmission(submissionData);

    return NextResponse.json({
      ok: true,
      filename: effectiveFilename,
      url: publicUrl,
      submissionId: submission?.id ?? null,
      message: "Video uploaded successfully to Supabase!",
    });
  } catch (err) {
    console.error("Upload metadata error:", err?.message || err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
