import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB — mirrors the client-side cap in broadcasts/page.tsx

/**
 * POST /api/admin/broadcast/upload-pdf
 * Body: { fileName: string, fileType: string, fileSize: number }
 *
 * Same pattern as upload-video: mints a short-lived signed Storage upload
 * URL/token instead of receiving the file itself, so the browser uploads
 * directly to Supabase and never routes the PDF's bytes through our
 * Next.js server (avoiding Vercel's request body size limit).
 *
 * Note: unlike video, PDFs are NOT compressed before upload — there's no
 * reliable client-side PDF compressor comparable to ffmpeg.wasm, so this
 * just caps the raw file size instead.
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
  if (fileType !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
  }
  if (fileSize !== null && fileSize > MAX_PDF_BYTES) {
    return NextResponse.json({ error: `PDF exceeds the 20MB limit (${(fileSize / (1024 * 1024)).toFixed(1)}MB).` }, { status: 400 });
  }

  const path = `broadcasts/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;

  const { data, error } = await supabaseAdmin.storage
    .from("broadcast-pdfs")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("broadcast-pdfs")
    .getPublicUrl(path);

  return NextResponse.json({ path: data.path, token: data.token, publicUrl });
}
