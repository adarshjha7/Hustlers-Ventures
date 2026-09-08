import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [broadcastsResult, readsResult, investorResult] = await Promise.all([
    supabaseAdmin
      .from("broadcast_logs")
      .select("id, subject, body, image_urls, created_at")
      .contains("results", [{ email: user.email, email_status: "sent" }])
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("notification_reads")
      .select("notification_type, notification_id")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("investors")
      .select("investor_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const readIds = (readsResult.data ?? []).map(
    (r: { notification_type: string; notification_id: string }) => `${r.notification_type}:${r.notification_id}`
  );

  let supportMessages: { id: string; thread_id: string; subject: string; ticket_ref: string; content: string | null; created_at: string }[] = [];
  const investorId = investorResult.data?.investor_id;
  if (investorId) {
    const { data: threads } = await supabaseAdmin
      .from("support_threads")
      .select("id, subject, ticket_ref")
      .eq("investor_id", investorId);
    const threadMap: Record<string, { subject: string; ticket_ref: string }> = {};
    (threads ?? []).forEach((t: { id: string; subject: string; ticket_ref: string }) => { threadMap[t.id] = t; });
    const threadIds = (threads ?? []).map((t: { id: string }) => t.id);

    if (threadIds.length > 0) {
      const { data: messages } = await supabaseAdmin
        .from("support_messages")
        .select("id, thread_id, content, created_at")
        .in("thread_id", threadIds)
        .eq("sender_role", "ADMIN")
        .order("created_at", { ascending: false })
        .limit(50);

      supportMessages = (messages ?? []).map((m: { id: string; thread_id: string; content: string | null; created_at: string }) => ({
        id: m.id,
        thread_id: m.thread_id,
        subject: threadMap[m.thread_id]?.subject ?? "Support Request",
        ticket_ref: threadMap[m.thread_id]?.ticket_ref ?? "",
        content: m.content,
        created_at: m.created_at,
      }));
    }
  }

  return NextResponse.json({
    broadcasts: broadcastsResult.data ?? [],
    supportMessages,
    readIds,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = items.map((item: { notification_type: string; notification_id: string }) => ({
    user_id: user.id,
    notification_type: item.notification_type,
    notification_id: String(item.notification_id),
  }));

  await supabaseAdmin
    .from("notification_reads")
    .upsert(rows, { onConflict: "user_id,notification_type,notification_id" });

  return NextResponse.json({ ok: true });
}
