"use client";

// Client-side image compression using the native Canvas API — no library,
// no WASM, no CSP changes. Downscales to a max dimension and re-encodes as
// JPEG. Unlike video, this is genuinely simple and reliable in every
// modern browser, so there's no fallback-on-failure path needed the way
// videoCompress.ts has one.

const MAX_DIMENSION = 1600; // plenty for email/WhatsApp — most sources are far bigger than needed
const JPEG_QUALITY = 0.82;

/**
 * Compresses an image File by downscaling (if larger than MAX_DIMENSION on
 * its longest side) and re-encoding as JPEG. Animated GIFs are returned
 * unchanged (re-encoding would flatten the animation to one frame).
 * Falls back to the original file if the compressed version isn't
 * actually smaller, or if compression fails for any reason.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const compressedName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".jpg";
    return new File([blob], compressedName, { type: "image/jpeg" });
  } catch {
    return file; // never block an upload over a compression failure
  }
}
