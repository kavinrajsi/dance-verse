// src/app/api/upload/route.js - Enhanced with debugging
import { NextResponse } from "next/server";
import { saveSubmission } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const sanitize = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadToVPS(fileBuffer, filename, contentType) {
  const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL || 'http://168.231.122.251:3001/upload';
  const VPS_API_KEY = process.env.VPS_API_KEY;

  console.log("🚀 Starting VPS upload:", {
    url: VPS_UPLOAD_URL,
    filename,
    contentType,
    bufferSize: fileBuffer.byteLength,
    bufferSizeFormatted: formatFileSize(fileBuffer.byteLength)
  });

  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: contentType });
    formData.append('file', blob, filename);
    
    if (VPS_API_KEY) {
      formData.append('api_key', VPS_API_KEY);
    }

    console.log("📤 Sending to VPS...");
    
    const response = await fetch(VPS_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': VPS_API_KEY ? `Bearer ${VPS_API_KEY}` : undefined,
      }
    });

    console.log("📥 VPS Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ VPS upload failed:", errorText);
      throw new Error(`VPS upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ VPS upload successful:", result);
    return result;
  } catch (error) {
    console.error('❌ VPS Upload Error:', error);
    throw new Error(`Failed to upload to VPS: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    // 🔍 DEBUG: Log request details
    const contentLength = req.headers.get('content-length');
    console.log("📝 Request details:", {
      contentLength,
      contentLengthFormatted: contentLength ? formatFileSize(parseInt(contentLength)) : 'unknown',
      headers: Object.fromEntries(req.headers.entries())
    });

    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      console.log("❌ Content-Length too large:", {
        contentLength: parseInt(contentLength),
        maxSize,
        contentLengthFormatted: formatFileSize(parseInt(contentLength)),
        maxSizeFormatted: formatFileSize(maxSize)
      });
      return NextResponse.json({ 
        error: "File too large. Maximum file size is 50MB." 
      }, { status: 413 });
    }

    console.log("📋 Parsing form data...");
    const formData = await req.formData();

    const file = formData.get("file");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const title = formData.get("title");

    // 🔍 DEBUG: Log form data
    console.log("📄 Form data received:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileSizeFormatted: file?.size ? formatFileSize(file.size) : 'unknown',
      fileType: file?.type,
      name,
      email,
      phone,
      title
    });

    if (!file || typeof file === "string") {
      console.log("❌ No file provided");
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    if (!file.type?.startsWith("video/")) {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });
    }

    // Check file size again after parsing
    if (file.size > maxSize) {
      console.log("❌ File size exceeds limit:", {
        fileSize: file.size,
        maxSize,
        fileSizeFormatted: formatFileSize(file.size),
        maxSizeFormatted: formatFileSize(maxSize)
      });
      return NextResponse.json({ 
        error: `File size (${formatFileSize(file.size)}) exceeds the 50MB limit.` 
      }, { status: 413 });
    }

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !title?.trim()) {
      console.log("❌ Missing required fields");
      return NextResponse.json({ 
        error: "All fields (name, email, phone, title) are required" 
      }, { status: 400 });
    }

    // Build filename
    const original = file.name || "video.mp4";
    const ext = original.split('.').pop() || "mp4";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const finalName = `${sanitize(name)}-${sanitize(email)}-${ts}.${ext}`;

    console.log("🔄 Converting file to buffer...");
    const fileBuffer = await file.arrayBuffer();
    
    console.log("✅ File converted to buffer:", {
      originalSize: file.size,
      bufferSize: fileBuffer.byteLength,
      match: file.size === fileBuffer.byteLength
    });

    // Upload to VPS
    const vpsResult = await uploadToVPS(fileBuffer, finalName, file.type);

    // Construct URLs
    const baseUrl = process.env.VPS_BASE_URL || 'http://168.231.122.251:3001';
    const videoUrl = vpsResult.url || `${baseUrl}/videos/${finalName}`;
    const downloadUrl = vpsResult.downloadUrl || `${baseUrl}/download/${finalName}`;

    // Prepare submission data
    const submissionData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      filename: finalName,
      blob_url: videoUrl,
      download_url: downloadUrl,
      file_size: file.size,
      file_type: file.type,
      storage_location: 'vps',
      vps_file_id: vpsResult.fileId || finalName
    };

    // Try to save to database
    try {
      const savedSubmission = await saveSubmission(submissionData);
      console.log("✅ Submission saved to database:", savedSubmission?.id);
      
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: videoUrl,
        downloadUrl: downloadUrl,
        submissionId: savedSubmission?.id,
        message: "Video uploaded and saved successfully!" 
      });
      
    } catch (dbError) {
      console.error("⚠️ Database save error (continuing anyway):", dbError);
      
      return NextResponse.json({ 
        ok: true, 
        filename: finalName, 
        url: videoUrl,
        downloadUrl: downloadUrl,
        message: "Video uploaded successfully!" 
      });
    }

  } catch (err) {
    console.error("❌ Upload error:", err);
    
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