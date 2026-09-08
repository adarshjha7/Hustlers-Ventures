import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /v/:code
 *
 * Public branded short link for broadcast video/PDF attachments — resolves
 * a random code (minted alongside each broadcast in /api/admin/broadcast)
 * to the actual Supabase Storage URL and redirects. Exists purely so
 * recipients in an email or WhatsApp message see
 * "hustlersventures.co/v/AbC123" instead of the raw, long Supabase storage
 * path. One code space covers both attachment types — a broadcast can have
 * a video short code, a PDF short code, or both, each pointing at its own
 * row via `.or()` below.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data } = await supabaseAdmin
    .from("broadcast_logs")
    .select("video_url, video_short_code, pdf_url, pdf_short_code")
    .or(`video_short_code.eq.${code},pdf_short_code.eq.${code}`)
    .maybeSingle();

  const target = data?.video_short_code === code ? data.video_url : data?.pdf_short_code === code ? data.pdf_url : null;

  if (!target) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  return NextResponse.redirect(target, { status: 302 });
}
