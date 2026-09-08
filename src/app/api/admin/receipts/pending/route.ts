import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET - list capital "add" transactions that don't have a receipt yet (receipt_url IS NULL)
export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: transactions, error } = await supabaseAdmin
    .from("investor_transactions")
    .select("transaction_id, investment_id, investment_amount, created_at")
    .eq("transaction_type", "add")
    .is("receipt_url", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!transactions || transactions.length === 0) return NextResponse.json({ pending: [] });

  const investmentIds = [...new Set(transactions.map(t => t.investment_id))];
  const { data: investments } = await supabaseAdmin
    .from("investor_investments")
    .select("investment_id, investor_id, purchase_id")
    .in("investment_id", investmentIds);

  const investmentsMap = new Map((investments ?? []).map(i => [i.investment_id, i]));

  const investorIds = [...new Set([...investmentsMap.values()].map(i => i.investor_id))];
  const poolIds = [...new Set([...investmentsMap.values()].map(i => i.purchase_id).filter(Boolean))];

  const [{ data: investors }, { data: pools }] = await Promise.all([
    supabaseAdmin.from("investors").select("investor_id, investor_name, email").in("investor_id", investorIds),
    supabaseAdmin.from("company_pools").select("purchase_id, pool_name, category_name").in("purchase_id", poolIds),
  ]);

  const investorsMap = new Map((investors ?? []).map(i => [i.investor_id, i]));
  const poolsMap = new Map((pools ?? []).map(p => [p.purchase_id, p]));

  // Debt/loan pools (e.g. "Debt Fund") are added as loans, not capital investments -
  // they never get a receipt in paymentcode.gs, so keep them out of this dashboard list.
  // (paymentcode.gs itself is unchanged and will still process them if run manually.)
  const pending = transactions
    .filter(t => {
      const investment = investmentsMap.get(t.investment_id);
      const pool = investment ? poolsMap.get(investment.purchase_id) : null;
      return pool?.category_name?.toUpperCase() !== "TWILIGHT LOAN";
    })
    .map(t => {
      const investment = investmentsMap.get(t.investment_id);
      const investor = investment ? investorsMap.get(investment.investor_id) : null;
      const pool = investment ? poolsMap.get(investment.purchase_id) : null;
      return {
        transaction_id: t.transaction_id,
        investor_name: investor?.investor_name ?? "(unknown investor)",
        investor_has_email: !!investor?.email,
        pool_name: pool?.pool_name ?? "(unknown asset)",
        amount: Number(t.investment_amount),
        created_at: t.created_at,
      };
    });

  return NextResponse.json({ pending });
}
