// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // consider increasing if network is slow

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
  // minimal map; expand as needed
  const map = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-matroska": "mkv",
    "video/avi": "avi",
  };
  return map[type] || "mp4";
}

async function uploadToVPS(fileBlob, filename, contentType) {
  const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL || "http://168.231.122.251:3001/upload";
  const VPS_API_KEY = process.env.VPS_API_KEY;

  // Build form data
  const formData = new FormData();
  formData.append("file", fileBlob, filename);
  if (VPS_API_KEY) formData.append("api_key", VPS_API_KEY);

  // Timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000); // leave headroom for maxDuration

  const headers = {};
  if (VPS_API_KEY) headers["Authorization"] = `Bearer ${VPS_API_KEY}`;

  let response;
  try {
    response = await fetch(VPS_UPLOAD_URL, {
      method: "POST",
      body: formData,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(`Network error contacting VPS: ${e.message}`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`VPS upload failed: ${response.status} ${response.statusText} ${text}`);
  }

  // Expect JSON; guard parse
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("VPS returned non-JSON response");
  }
  return result;
}

export async function POST(req) {
  try {
    const maxSize = 45 * 1024 * 1024; // 45MB

    // Avoid logging all headers (can contain auth). Log only size.
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

    // Required fields + shape
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

    // Filename
    const original = file.name || "video";
    const origExt = original.includes(".") ? original.split(".").pop() : null;
    const safeName = sanitize(name) || "user";
    const safeEmail = sanitize(email) || "email";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = (origExt && sanitize(origExt)) || extFromMime(file.type);
    const finalName = `${safeName}-${safeEmail}-${ts}.${ext}`;

    // Convert to Blob (no need to create a second buffer later)
    const arrayBuf = await file.arrayBuffer();
    const blob = new Blob([arrayBuf], { type: file.type });

    // Upload to VPS
    const vpsResult = await uploadToVPS(blob, finalName, file.type);

    const baseUrl = process.env.VPS_BASE_URL || "http://168.231.122.251:3001";
    const videoUrl = typeof vpsResult?.url === "string" && vpsResult.url
      ? vpsResult.url
      : `${baseUrl}/videos/${finalName}`;
    const downloadUrl = typeof vpsResult?.downloadUrl === "string" && vpsResult.downloadUrl
      ? vpsResult.downloadUrl
      : `${baseUrl}/download/${finalName}`;
    const vpsFileId = typeof vpsResult?.fileId === "string" && vpsResult.fileId
      ? vpsResult.fileId
      : finalName;

    // Save submission (best-effort)
    try {
      const saved = await saveSubmission({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        title: title.trim(),
        filename: finalName,
        blob_url: videoUrl,
        download_url: downloadUrl,
        file_size: file.size,
        file_type: file.type,
        storage_location: "vps",
        vps_file_id: vpsFileId,
      });

      return NextResponse.json({
        ok: true,
        filename: finalName,
        url: videoUrl,
        downloadUrl,
        submissionId: saved?.id,
        message: "Video uploaded and saved successfully!",
      });
    } catch (e) {
      // Log minimal info
      console.error("DB save failed:", e?.message || e);
      return NextResponse.json({
        ok: true,
        filename: finalName,
        url: videoUrl,
        downloadUrl,
        message: "Video uploaded successfully!",
      });
    }
  } catch (err) {
    console.error("Upload error:", err?.message || err);
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Upload timed out" }, { status: 504 });
    }
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
