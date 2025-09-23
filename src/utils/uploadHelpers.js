const EXTENSION_MAP = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
  "video/avi": "avi",
};

export const MAX_UPLOAD_SIZE_BYTES = 45 * 1024 * 1024; // 45MB
export const MAX_UPLOAD_SIZE_LABEL = "45MB";

export function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function isPhone(value) {
  return /^[\+]?[0-9\s\-()]{10,15}$/.test(String(value || "").trim());
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${parseFloat(size.toFixed(2))} ${sizes[i]}`;
}

export function extFromMime(type) {
  return EXTENSION_MAP[type] || "mp4";
}

export function buildSupabaseFilename({ name, email }, file) {
  const originalName = file?.name || "video";
  const originalExt = originalName.includes(".")
    ? originalName.split(".").pop()
    : null;
  const safeName = sanitizeSegment(name) || "user";
  const safeEmail = sanitizeSegment(email) || "email";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = (originalExt && sanitizeSegment(originalExt)) || extFromMime(file?.type);

  return `${safeName}-${safeEmail}-${timestamp}.${extension}`;
}
