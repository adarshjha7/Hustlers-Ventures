import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — mirrors the client-side cap in broadcasts/page.tsx

/**
 * POST /api/admin/broadcast/upload-video
 * Body: { fileName: string, fileType: string, fileSize: number }
 *
 * Does NOT receive the video's bytes — it only mints a short-lived signed
 * upload URL/token for Supabase Storage. The browser then uploads the file
 * directly to Supabase (see uploadToSignedUrl on the client), bypassing our
 * Next.js server entirely. This is deliberate: routing video through a
 * Vercel serverless function would hit its request body size limit.
 *
 * fileSize is the client's declared size, used only to reject obviously
 * oversized requests before minting an upload URL — a modified client
 * could still lie about it, so the Storage bucket's own file_size_limit
 * (see sql_scripts/broadcast_video_migration.sql) is the real backstop.
 */
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let payload: { fileName?: unknown; fileType?: unknown; fileSize?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fileName = typeof payload.fileName === "string" ? payload.fileName : "";
  const fileType = typeof payload.fileType === "string" ? payload.fileType : "";
  const fileSize = typeof payload.fileSize === "number" ? payload.fileSize : null;

  if (!fileName) return NextResponse.json({ error: "fileName is required." }, { status: 400 });
  if (!ALLOWED_VIDEO_TYPES.includes(fileType)) {
    return NextResponse.json({ error: "Only MP4, WebM, MOV, and MKV videos are allowed." }, { status: 400 });
  }
  if (fileSize !== null && fileSize > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: `Video exceeds the 50MB limit (${(fileSize / (1024 * 1024)).toFixed(1)}MB).` }, { status: 400 });
  }

  const ext = fileName.split(".").pop() || "mp4";
  const path = `broadcasts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("broadcast-videos")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("broadcast-videos")
    .getPublicUrl(path);

  return NextResponse.json({ path: data.path, token: data.token, publicUrl });
}
