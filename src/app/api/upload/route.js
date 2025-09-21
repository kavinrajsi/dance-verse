// app/api/upload/route.js
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";   // ensure not cached
export const runtime = "nodejs";          // fs requires Node runtime

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

    if (!file || typeof file === "string")
      return NextResponse.json({ error: "No video provided" }, { status: 400 });

    if (!file.type?.startsWith("video/"))
      return NextResponse.json({ error: "File must be a video" }, { status: 400 });

    // Build filename: name-email-timestamp-filename
    const original = file.name || "video.mp4";
    const ext = path.extname(original) || ".mp4";
    const base = path.basename(original, ext);

    const ts = new Date().toISOString().replace(/[:.]/g, "-"); // safe for files
    const finalName = `${sanitize(name)}-${sanitize(email)}-${ts}-${sanitize(base)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, finalName), buffer);

    // public URL
    const url = `/uploads/${finalName}`;

    return NextResponse.json({ ok: true, filename: finalName, url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
