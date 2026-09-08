import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isDistinctAssociateName } from "@/lib/supportUtils";

// GET — admin inbox: all support threads, joined with investor name + associate name
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let query = supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, category, status, last_message_at, admin_unread_count, investor_id, created_at")
    .order("last_message_at", { ascending: false });

  if (status && status !== "ALL") query = query.eq("status", status);
  // Text search (subject / ticket_ref / investor name) is applied in-memory below,
  // after the investor name join, since it can't be expressed as a single query filter.

  const [{ data: threads, error }, { data: investors }] = await Promise.all([
    query,
    supabaseAdmin.from("investors").select("investor_id, investor_name, associate_name"),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const threadIds = (threads ?? []).map(t => t.id);
  const { data: messages } = threadIds.length
    ? await supabaseAdmin
        .from("support_messages")
        .select("thread_id, content")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const messageStatsMap: Record<string, { count: number; lastMessage: string | null }> = {};
  (messages ?? []).forEach((m: { thread_id: string; content: string | null }) => {
    const entry = messageStatsMap[m.thread_id] ?? { count: 0, lastMessage: null };
    entry.count += 1;
    entry.lastMessage = m.content;
    messageStatsMap[m.thread_id] = entry;
  });

  const investorMap: Record<string, { name: string; associateName: string | null }> = {};
  (investors ?? []).forEach((i: { investor_id: string; investor_name: string; associate_name: string | null }) => {
    investorMap[i.investor_id] = { name: i.investor_name, associateName: i.associate_name };
  });

  const filterQ = q?.toLowerCase();
  let enriched = (threads ?? []).map(t => {
    const investorName = investorMap[t.investor_id]?.name ?? "Unknown";
    const associateName = investorMap[t.investor_id]?.associateName ?? null;
    const stats = messageStatsMap[t.id];
    return {
      ...t,
      investor_name: investorName,
      associate_name: isDistinctAssociateName(investorName, associateName) ? associateName : null,
      message_count: stats?.count ?? 0,
      last_message: stats?.lastMessage ?? null,
    };
  });

  if (filterQ) {
    enriched = enriched.filter(t =>
      t.subject.toLowerCase().includes(filterQ) ||
      t.ticket_ref.toLowerCase().includes(filterQ) ||
      t.investor_name.toLowerCase().includes(filterQ)
    );
  }

  return NextResponse.json({ threads: enriched });
}
