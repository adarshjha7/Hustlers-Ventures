import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET — full thread detail (investor's own thread only), marks admin messages as read
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A login can map to more than one investor profile (e.g. a shared family/associate
  // login) — fetch all matches rather than .maybeSingle(), which errors on >1 row.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", user.id);
  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor profile not found." }, { status: 404 });
  const investorIds = investors.map(i => i.investor_id);

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, category, status, created_at")
    .eq("id", id)
    .in("investor_id", investorIds)
    .maybeSingle();
  if (threadError) return NextResponse.json({ error: threadError.message }, { status: 500 });
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("support_messages")
    .select("id, sender_id, sender_role, content, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });
  if (messagesError) return NextResponse.json({ error: messagesError.message }, { status: 500 });

  const messageIds = (messages ?? []).map(m => m.id);
  const { data: attachments } = messageIds.length
    ? await supabaseAdmin
        .from("message_attachments")
        .select("id, message_id, file_name, file_path, file_size_bytes, mime_type, file_category")
        .in("message_id", messageIds)
    : { data: [] };

  const attachmentsWithUrls = await Promise.all(
    (attachments ?? []).map(async a => {
      const { data: signed } = await supabaseAdmin.storage
        .from("support-attachments")
        .createSignedUrl(a.file_path, 300);
      return { ...a, downloadUrl: signed?.signedUrl ?? null };
    })
  );

  const attachmentsByMessage: Record<string, typeof attachmentsWithUrls> = {};
  attachmentsWithUrls.forEach(a => {
    (attachmentsByMessage[a.message_id] ??= []).push(a);
  });

  const enrichedMessages = (messages ?? []).map(m => ({
    ...m,
    attachments: attachmentsByMessage[m.id] ?? [],
  }));

  // Mark admin messages in this thread as read for this investor.
  const adminMessageIds = (messages ?? []).filter(m => m.sender_role === "ADMIN").map(m => m.id);
  if (adminMessageIds.length > 0) {
    await supabaseAdmin
      .from("notification_reads")
      .upsert(
        adminMessageIds.map(mid => ({ user_id: user.id, notification_type: "support", notification_id: mid })),
        { onConflict: "user_id,notification_type,notification_id" }
      );
    await supabaseAdmin.from("support_threads").update({ investor_unread_count: 0 }).eq("id", id);
  }

  return NextResponse.json({ thread, messages: enrichedMessages });
}
