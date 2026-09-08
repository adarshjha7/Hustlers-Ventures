import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [logsResult, eventsResult] = await Promise.all([
    supabaseAdmin
      .from("broadcast_logs")
      .select("id, subject, body, image_urls, video_url, pdf_url, recipient_filter, recipient_count, sent_count, failed_count, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("email_events")
      .select("ref_id, uid")
      .eq("email_type", "broadcast"),
  ]);

  if (logsResult.error) return NextResponse.json({ error: logsResult.error.message }, { status: 500 });

  // Group opens per broadcast — decode uid (base64url → email) and deduplicate
  const openMap: Record<string, Set<string>> = {};
  for (const ev of eventsResult.data ?? []) {
    if (!ev.ref_id) continue;
    if (!openMap[ev.ref_id]) openMap[ev.ref_id] = new Set();
    if (ev.uid) {
      try {
        const email = Buffer.from(ev.uid, "base64url").toString("utf-8");
        openMap[ev.ref_id].add(email);
      } catch { /* ignore malformed uid */ }
    }
  }

  const logs = (logsResult.data ?? []).map(log => {
    const openers = openMap[log.id] ? [...openMap[log.id]] : [];
    return { ...log, open_count: openers.length, openers };
  });

  return NextResponse.json({ logs });
}
