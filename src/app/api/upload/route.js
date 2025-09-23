// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { uploadToSupabaseStorage, saveSubmission } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const sanitize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
const isPhone = (s) => /^[\+]?[0-9\s\-()]{10,15}$/.test(String(s || "").trim());

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function extFromMime(type) {
  const map = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-matroska": "mkv",
    "video/avi": "avi",
  };
  return map[type] || "mp4";
}

export async function POST(req) {
  try {
    const maxSize = 45 * 1024 * 1024; // 45MB

    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum file size is 45MB." },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const phone = String(formData.get("phone") || "");
    const title = String(formData.get("title") || "");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }
    if (!file.type?.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size (${formatFileSize(file.size)}) exceeds the 45MB limit.` },
        { status: 413 }
      );
    }

    // Validate required fields
    if (!name.trim() || !email.trim() || !phone.trim() || !title.trim()) {
      return NextResponse.json(
        { error: "All fields (name, email, phone, title) are required" },
        { status: 400 }
      );
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Generate filename
    const original = file.name || "video";
    const origExt = original.includes(".") ? original.split(".").pop() : null;
    const safeName = sanitize(name) || "user";
    const safeEmail = sanitize(email) || "email";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = (origExt && sanitize(origExt)) || extFromMime(file.type);
    const finalName = `${safeName}-${safeEmail}-${ts}.${ext}`;

    // Upload to Supabase Storage
    console.log("Uploading to Supabase Storage...");
    const storageResult = await uploadToSupabaseStorage(file, finalName);
    console.log("Storage upload successful:", storageResult.url);

    // Save submission data to database
    const submissionData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      filename: finalName,
      blob_url: storageResult.url,
      download_url: storageResult.url, // Same as blob_url for Supabase
      file_size: file.size,
      file_type: file.type,
      storage_location: 'supabase',
      vps_file_id: null
    };

    const submission = await saveSubmission(submissionData);

    return NextResponse.json({
      ok: true,
      filename: finalName,
      url: storageResult.url,
      submissionId: submission?.id,
      message: "Video uploaded successfully to Supabase!",
    });

  } catch (err) {
    console.error("Upload error:", err?.message || err);
    
    if (err?.name === "PayloadTooLargeError" || String(err?.message || "").includes("413")) {
      return NextResponse.json(
        { error: "File too large. Maximum file size is 45MB." },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: err?.message || "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}