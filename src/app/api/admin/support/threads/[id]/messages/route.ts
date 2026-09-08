import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSupportReplyReceivedEmail } from "@/lib/mailer";

// POST — admin reply to the investor. Does NOT auto-reopen a CLOSED thread (intentional asymmetry
// vs. the investor-side reply route) — an admin closing a ticket means resolved; reopening is the
// investor's explicit action.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { content, attachments } = await req.json();
  if (!content?.trim() && !(Array.isArray(attachments) && attachments.length > 0)) {
    return NextResponse.json({ error: "Message content or an attachment is required." }, { status: 400 });
  }

  const { data: thread } = await supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, investor_id")
    .eq("id", id)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  const { data: message, error: messageError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      thread_id: id,
      sender_id: admin.id,
      sender_role: "ADMIN",
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

  try {
    const { data: investor } = await supabaseAdmin
      .from("investors")
      .select("investor_name, user_id")
      .eq("investor_id", thread.investor_id)
      .maybeSingle();
    if (investor?.user_id) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(investor.user_id);
      const investorEmail = authUser?.user?.email;
      if (investorEmail) {
        await sendSupportReplyReceivedEmail({
          toEmail: investorEmail,
          toName: investor.investor_name,
          ticketRef: thread.ticket_ref,
          subject: thread.subject,
          threadId: thread.id,
        });
      }
    }
  } catch (mailErr) {
    console.error("Support reply notification email failed:", mailErr);
  }

  return NextResponse.json({ message });
}
