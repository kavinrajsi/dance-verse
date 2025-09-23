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

const allowHttpFromEnv =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_ALLOW_HTTP === "true";

export function normalizeSupabaseUrl(url, options = {}) {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;

  const isLikelyLocalUrl = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i.test(trimmed) ||
    /^http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01]))/i.test(trimmed);

  const allowHttp =
    (typeof window !== "undefined" && window.location?.protocol === "http:") ||
    options.allowHttp === true ||
    (options.allowHttp === undefined && allowHttpFromEnv) ||
    isLikelyLocalUrl;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" && !allowHttp) {
      parsed.protocol = "https:";
      if (parsed.port === "80") {
        parsed.port = "";
      }
    }
    if (!parsed.protocol || parsed.protocol === ":") {
      if (allowHttp && typeof window !== "undefined" && window.location?.protocol) {
        parsed.protocol = window.location.protocol;
      } else {
        parsed.protocol = "https:";
      }
    }
    if (!allowHttp && parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    if (allowHttp) {
      return trimmed.replace(/\/+$/, "");
    }

    const coerced = trimmed.replace(/^http:/i, "https:");
    return coerced.replace(/\/+$/, "");
  }
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
