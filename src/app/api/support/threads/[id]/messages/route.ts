import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST — investor sends a reply into their own thread. Rejected once the thread is resolved —
// reopening is a separate explicit action (POST .../reopen), not implicit via replying.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: thread } = await supabaseAdmin
    .from("support_threads")
    .select("id, status")
    .eq("id", id)
    .in("investor_id", investorIds)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  if (thread.status === "CLOSED") {
    return NextResponse.json({ error: "This request is resolved. Reopen it to continue the conversation." }, { status: 400 });
  }

  const { content, attachments } = await req.json();
  if (!content?.trim() && !(Array.isArray(attachments) && attachments.length > 0)) {
    return NextResponse.json({ error: "Message content or an attachment is required." }, { status: 400 });
  }

  const { data: message, error: messageError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      thread_id: id,
      sender_id: user.id,
      sender_role: "INVESTOR",
      content: content?.trim() || null,
    })
    .select("id, sender_id, sender_role, content, created_at")
    .single();
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });

  if (Array.isArray(attachments) && attachments.length > 0) {
    const rows = attachments.map((a: { path: string; fileName: string; sizeBytes: number; mimeType: string; fileCategory: string }) => ({
      message_id: message.id,
      file_name: a.fileName,
      file_path: a.path,
      file_size_bytes: a.sizeBytes,
      mime_type: a.mimeType,
      file_category: a.fileCategory,
    }));
    await supabaseAdmin.from("message_attachments").insert(rows);
  }

  return NextResponse.json({ message });
}
