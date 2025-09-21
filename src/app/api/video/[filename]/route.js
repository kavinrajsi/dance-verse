// app/api/video/[filename]/route.js
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { filename } = params;
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Check if we're on Vercel
    const isVercel = process.env.VERCEL === "1";
    const filePath = isVercel 
      ? path.join("/tmp", "uploads", filename)
      : path.join(process.cwd(), "public", "uploads", filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = "video/mp4"; // default
    
    switch (ext) {
      case ".mp4":
        contentType = "video/mp4";
        break;
      case ".mov":
        contentType = "video/quicktime";
        break;
      case ".avi":
        contentType = "video/x-msvideo";
        break;
      case ".webm":
        contentType = "video/webm";
        break;
      case ".mkv":
        contentType = "video/x-matroska";
        break;
      default:
        contentType = "video/mp4";
    }

    // Return the video file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error serving video:", error);
    return NextResponse.json({ 
      error: "Failed to serve video" 
    }, { status: 500 });
  }
}