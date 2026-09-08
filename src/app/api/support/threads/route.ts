import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SUPPORT_CATEGORIES } from "@/lib/supportUtils";
import { sendSupportTicketRaisedEmail } from "@/lib/mailer";

// GET — list the current investor's own support threads
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let query = supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, category, status, last_message_at, investor_unread_count, created_at")
    .in("investor_id", investorIds)
    .order("last_message_at", { ascending: false });

  if (status && status !== "ALL") query = query.eq("status", status);
  if (q) query = query.or(`subject.ilike.%${q}%,ticket_ref.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ threads: data ?? [] });
}

// POST — create a new support thread with an initial message
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A login can map to more than one investor profile (e.g. a shared family/associate
  // login) — fetch all matches rather than .maybeSingle(), which errors on >1 row.
  // support_threads.investor_id is a single FK, so the thread is filed under the first
  // profile (alphabetical, for a deterministic pick); the ticket itself, its combined
  // requester name, and the GET above are all still shared across every linked profile.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id, investor_name")
    .eq("user_id", user.id)
    .order("investor_name");
  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor profile not found." }, { status: 404 });
  const investor = investors[0];
  const requesterName = investors.map(i => i.investor_name.trim()).join(" & ");

  const { subject, category, message, attachments } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }
  const resolvedCategory = SUPPORT_CATEGORIES.includes(category) ? category : "Other";

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("support_threads")
    .insert({ investor_id: investor.investor_id, subject: subject.trim(), category: resolvedCategory })
    .select("id, ticket_ref")
    .single();
  if (threadError) return NextResponse.json({ error: threadError.message }, { status: 500 });

  const { data: firstMessage, error: messageError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      thread_id: thread.id,
      sender_id: user.id,
      sender_role: "INVESTOR",
      content: message.trim(),
    })
    .select("id")
    .single();
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });

  if (Array.isArray(attachments) && attachments.length > 0) {
    const rows = attachments.map((a: { path: string; fileName: string; sizeBytes: number; mimeType: string; fileCategory: string }) => ({
      message_id: firstMessage.id,
      file_name: a.fileName,
      file_path: a.path,
      file_size_bytes: a.sizeBytes,
      mime_type: a.mimeType,
      file_category: a.fileCategory,
    }));
    await supabaseAdmin.from("message_attachments").insert(rows);
  }

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Support thread created",
    metadata: { userId: user.id, threadId: thread.id, ticketRef: thread.ticket_ref },
  });

  try {
    await sendSupportTicketRaisedEmail({
      investorName: requesterName,
      ticketRef: thread.ticket_ref,
      subject: subject.trim(),
      message: message.trim(),
      threadId: thread.id,
    });
  } catch (mailErr) {
    console.error("Support ticket notification email failed:", mailErr);
  }

  return NextResponse.json({ threadId: thread.id, ticketRef: thread.ticket_ref });
}
