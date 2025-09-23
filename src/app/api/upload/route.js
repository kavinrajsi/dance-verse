// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ CHANGED: from "edge" to "nodejs"

// Configure max duration and size
export const maxDuration = 60; // 60 seconds

// ✅ REMOVED: config object (not needed with new approach)

const sanitize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ✅ NEW: Upload file to VPS function
async function uploadToVPS(fileBuffer, filename, contentType) {
  const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL || 'http://168.231.122.251:3001/upload';
  const VPS_API_KEY = process.env.VPS_API_KEY;

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: contentType });
    formData.append('file', blob, filename);
    
    if (VPS_API_KEY) {
      formData.append('api_key', VPS_API_KEY);
    }

    const response = await fetch(VPS_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': VPS_API_KEY ? `Bearer ${VPS_API_KEY}` : undefined,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VPS upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('VPS Upload Error:', error);
    throw new Error(`Failed to upload to VPS: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    // Check content length early
    const contentLength = req.headers.get('content-length');
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum file size is 50MB." 
      }, { status: 413 });
    }

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

    // Check file size again after parsing
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size (${formatFileSize(file.size)}) exceeds the 50MB limit.` 
      }, { status: 413 });
    }

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !title?.trim()) {
      return NextResponse.json({ 
        error: "All fields (name, email, phone, title) are required" 
      }, { status: 400 });
    }

    // Build filename
    const original = file.name || "video.mp4";
    const ext = original.split('.').pop() || "mp4";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const finalName = `${sanitize(name)}-${sanitize(email)}-${ts}.${ext}`;

    // ✅ NEW: Convert file to buffer for VPS upload
    const fileBuffer = await file.arrayBuffer();

    // ✅ CHANGED: Upload to VPS instead of Vercel Blob
    const vpsResult = await uploadToVPS(fileBuffer, finalName, file.type);

    // ✅ NEW: Construct URLs based on VPS response
    const baseUrl = process.env.VPS_BASE_URL || 'http://168.231.122.251:3001';
    const videoUrl = vpsResult.url || `${baseUrl}/videos/${finalName}`;
    const downloadUrl = vpsResult.downloadUrl || `${baseUrl}/download/${finalName}`;

    // ✅ CHANGED: Prepare submission data with VPS URLs
    const submissionData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      filename: finalName,
      blob_url: videoUrl, // ✅ CHANGED: Now points to VPS
      download_url: downloadUrl, // ✅ CHANGED: Now points to VPS
      file_size: file.size,
      file_type: file.type,
      storage_location: 'vps', // ✅ NEW: Track storage location
      vps_file_id: vpsResult.fileId || finalName // ✅ NEW: Store VPS file ID
    };

    // Try to save to database (optional - won't fail if DB is not configured)
    try {
      const savedSubmission = await saveSubmission(submissionData);
      
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: videoUrl, // ✅ CHANGED: VPS URL
        downloadUrl: downloadUrl, // ✅ CHANGED: VPS URL
        submissionId: savedSubmission?.id,
        message: "Video uploaded and saved successfully!" 
      });
      
    } catch (dbError) {
      console.error("Database save error (continuing anyway):", dbError);
      
      // Video was uploaded successfully, database save failed but that's okay
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: videoUrl, // ✅ CHANGED: VPS URL
        downloadUrl: downloadUrl, // ✅ CHANGED: VPS URL
        message: "Video uploaded successfully!" 
      });
    }

  } catch (err) {
    console.error("Upload error:", err);
    
    // Handle specific error types
    if (err.name === 'PayloadTooLargeError' || err.message?.includes('413')) {
      return NextResponse.json({ 
        error: "File too large. Maximum file size is 50MB." 
      }, { status: 413 });
    }
    
    return NextResponse.json({ 
      error: err.message || "Upload failed. Please try again." 
    }, { status: 500 });
  }
}