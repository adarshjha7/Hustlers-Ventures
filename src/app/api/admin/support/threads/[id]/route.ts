import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET — full thread detail incl. messages, attachments, and Investor Context panel data
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, category, status, investor_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (threadError) return NextResponse.json({ error: threadError.message }, { status: 500 });
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  const [{ data: messages, error: messagesError }, { data: investor }, { data: investments }, { data: authUsers }] = await Promise.all([
    supabaseAdmin
      .from("support_messages")
      .select("id, sender_id, sender_role, content, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, user_id, phone")
      .eq("investor_id", thread.investor_id)
      .maybeSingle(),
    supabaseAdmin
      .from("investor_investments")
      .select("investment_id, purchase_id, total_amount")
      .eq("investor_id", thread.investor_id),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
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

  // Reset the admin unread counter now that the thread has been opened.
  await supabaseAdmin.from("support_threads").update({ admin_unread_count: 0 }).eq("id", id);

  type InvestmentRow = { purchase_id: string | null; total_amount: number | null };
  const investmentRows = (investments ?? []) as InvestmentRow[];

  const totalInvested = investmentRows.reduce((sum, inv) => sum + Number(inv.total_amount ?? 0), 0);
  const investorEmail = authUsers?.users.find(u => u.id === investor?.user_id)?.email ?? "";
  const activePools = new Set(investmentRows.map(inv => inv.purchase_id).filter(Boolean)).size;

  return NextResponse.json({
    thread,
    messages: enrichedMessages,
    investorContext: {
      name: investor?.investor_name ?? "Unknown",
      email: investorEmail,
      phone: investor?.phone ?? null,
      totalInvested,
      activePools,
    },
  });
}

// Category is set by the investor at creation and displayed read-only to admin — no PATCH here.
// Status is fully automatic (OPEN on creation, IN_PROGRESS via trigger on the admin's first
// reply, CLOSED/reopened only via the investor's own explicit actions). There is a single admin
// account, so no assignment concept either.
