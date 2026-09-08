import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET — onboarding status per investor: has an invite been sent, did it deliver, has the
// investor completed registration yet. Built entirely from `investors` (user_id present =
// registered) plus system_logs (no schema change needed) — see the matching log messages
// written in /api/admin/invite and /api/register.
export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: investors, error }, { data: logs }] = await Promise.all([
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, phone, associate_name, user_id, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("system_logs")
      .select("message, metadata, created_at")
      .in("message", [
        "Onboarding invite sent",
        "Investor completed registration (backfilled pending record)",
      ])
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Logs are already newest-first, so the first match per investorId is the latest one.
  const lastInviteByInvestor = new Map<string, { sentAt: string; whatsappSent: boolean; whatsappError: string | null; resent: boolean }>();
  const registeredAtByInvestor = new Map<string, string>();

  for (const log of logs ?? []) {
    const meta = (log.metadata as any) ?? {};
    const investorId = meta.investorId as string | undefined;
    if (!investorId) continue;

    if (log.message === "Onboarding invite sent" && !lastInviteByInvestor.has(investorId)) {
      lastInviteByInvestor.set(investorId, {
        sentAt: log.created_at,
        whatsappSent: !!meta.whatsappSent,
        whatsappError: meta.whatsappError ?? null,
        resent: !!meta.resent,
      });
    }
    if (log.message === "Investor completed registration (backfilled pending record)" && !registeredAtByInvestor.has(investorId)) {
      registeredAtByInvestor.set(investorId, log.created_at);
    }
  }

  const report = (investors ?? []).map(inv => {
    const invite = lastInviteByInvestor.get(inv.investor_id) ?? null;
    const registered = !!inv.user_id;
    return {
      investor_id: inv.investor_id,
      investor_name: inv.investor_name,
      phone: inv.phone,
      associate_name: inv.associate_name,
      status: registered ? "registered" : "pending",
      inviteSentAt: invite?.sentAt ?? null,
      whatsappSent: invite?.whatsappSent ?? null,
      whatsappError: invite?.whatsappError ?? null,
      registeredAt: registered ? (registeredAtByInvestor.get(inv.investor_id) ?? null) : null,
    };
  });

  return NextResponse.json({ report });
}
