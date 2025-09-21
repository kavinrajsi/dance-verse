// app/api/upload/route.js
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { saveSubmission } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Use edge runtime for better performance

const sanitize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const title = formData.get("title");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    if (!file.type?.startsWith("video/")) {
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size must be less than 50MB" 
      }, { status: 400 });
    }

    // Build filename
    const original = file.name || "video.mp4";
    const ext = original.split('.').pop() || "mp4";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const finalName = `${sanitize(name)}-${sanitize(email)}-${ts}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(finalName, file, {
      access: 'public',
      contentType: file.type,
    });

    // Prepare submission data
    const submissionData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      filename: finalName,
      blob_url: blob.url,
      download_url: blob.downloadUrl,
      file_size: file.size,
      file_type: file.type
    };

    // Try to save to database (optional - won't fail if DB is not configured)
    try {
      const savedSubmission = await saveSubmission(submissionData);
      
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        submissionId: savedSubmission?.id,
        message: "Video uploaded and saved successfully!" 
      });
      
    } catch (dbError) {
      console.error("Database save error (continuing anyway):", dbError);
      
      // Video was uploaded successfully, database save failed but that's okay
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        message: "Video uploaded successfully!" 
      });
    }

  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ 
      error: err.message || "Upload failed. Please try again." 
    }, { status: 500 });
  }
}