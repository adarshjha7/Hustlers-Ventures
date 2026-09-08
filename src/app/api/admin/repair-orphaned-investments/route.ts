import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST — finds investor_investments rows with user_id: null where the linked investor
// IS registered (has a real user_id), and backfills them. Safety net for the registration
// backfill step ever failing/being skipped — safe to run anytime, idempotent (no-op if
// nothing is orphaned).
export async function POST() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: orphaned, error } = await supabaseAdmin
    .from("investor_investments")
    .select("investment_id, investor_id, investors!inner(user_id)")
    .is("user_id", null)
    .not("investors.user_id", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orphaned || orphaned.length === 0) {
    return NextResponse.json({ fixed: 0, details: [] });
  }

  const details: { investmentId: string; investorId: string; userId: string }[] = [];
  for (const row of orphaned as any[]) {
    const userId = row.investors.user_id;
    const { error: updateError } = await supabaseAdmin
      .from("investor_investments")
      .update({ user_id: userId })
      .eq("investment_id", row.investment_id);
    if (!updateError) {
      details.push({ investmentId: row.investment_id, investorId: row.investor_id, userId });
    }
  }

  await supabaseAdmin.from("system_logs").insert({
    level: "WARN",
    message: "Admin ran orphaned-investment repair",
    metadata: { adminEmail: admin.email, fixedCount: details.length, details },
  }).then(null, console.error);

  return NextResponse.json({ fixed: details.length, details });
}
