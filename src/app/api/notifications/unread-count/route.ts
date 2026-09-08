import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ count: 0 });

  const [readsResult, investmentsResult, broadcastsResult, investorResult] = await Promise.all([
    supabaseAdmin
      .from("notification_reads")
      .select("notification_type, notification_id")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("investor_investments")
      .select("investment_id")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("broadcast_logs")
      .select("id")
      .contains("results", [{ email: user.email, email_status: "sent" }]),
    supabaseAdmin
      .from("investors")
      .select("investor_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const readSet = new Set(
    (readsResult.data ?? []).map((r: { notification_type: string; notification_id: string }) => `${r.notification_type}:${r.notification_id}`)
  );

  // Count unread payouts
  let payoutUnread = 0;
  const investments = investmentsResult.data ?? [];
  if (investments.length > 0) {
    const investmentIds = investments.map((i: { investment_id: string }) => i.investment_id);
    const { data: payouts } = await supabaseAdmin
      .from("investor_quarterly_payments")
      .select("payment_id")
      .in("investment_id", investmentIds);
    payoutUnread = (payouts ?? []).filter(
      (p: { payment_id: string }) => !readSet.has(`payout:${p.payment_id}`)
    ).length;
  }

  // Count unread broadcasts
  const broadcastUnread = (broadcastsResult.data ?? []).filter(
    (b: { id: string }) => !readSet.has(`broadcast:${b.id}`)
  ).length;

  // Count unread support replies (admin messages in this investor's own threads)
  let supportUnread = 0;
  const investorId = investorResult.data?.investor_id;
  if (investorId) {
    const { data: threadIds } = await supabaseAdmin
      .from("support_threads")
      .select("id")
      .eq("investor_id", investorId);
    const ids = (threadIds ?? []).map((t: { id: string }) => t.id);
    if (ids.length > 0) {
      const { data: adminMessages } = await supabaseAdmin
        .from("support_messages")
        .select("id")
        .in("thread_id", ids)
        .eq("sender_role", "ADMIN");
      supportUnread = (adminMessages ?? []).filter(
        (m: { id: string }) => !readSet.has(`support:${m.id}`)
      ).length;
    }
  }

  return NextResponse.json({ count: payoutUnread + broadcastUnread + supportUnread });
}
