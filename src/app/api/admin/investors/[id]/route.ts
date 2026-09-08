import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: investorId } = await params;

  const { data: investor, error: invError } = await supabaseAdmin
    .from("investors")
    .select("investor_id, user_id, investor_name, phone, pan_number, is_active, requires_password_change, associate_name")
    .eq("investor_id", investorId)
    .single();

  if (invError || !investor) return NextResponse.json({ error: "Investor not found." }, { status: 404 });

  // Get email from auth
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const email = authUsers?.users.find(u => u.id === investor.user_id)?.email ?? "";

  // Fetch investments
  const { data: investments } = await supabaseAdmin
    .from("investor_investments")
    .select("investment_id, total_amount, company_name, created_at, pool_id, company_pools ( pool_name )")
    .eq("user_id", investor.user_id)
    .order("created_at", { ascending: false });

  const investmentIds = (investments ?? []).map((i: any) => i.investment_id);

  // Fetch tx counts + payouts in parallel
  const [txResult, payoutsResult] = await Promise.all([
    investmentIds.length > 0
      ? supabaseAdmin.from("investor_transactions").select("investment_id").in("investment_id", investmentIds)
      : Promise.resolve({ data: [] }),
    investmentIds.length > 0
      ? supabaseAdmin
          .from("investor_quarterly_payments")
          .select("payment_id, investment_id, gross_roi_amount, emergency_fund_deduction, tds_deduction, net_payable_amount, payment_date, payment_reference, is_tds_filed, months_considered, receipt_url, remarks, created_at, quarterly_roi_declarations ( quarter_year )")
          .in("investment_id", investmentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const txCountMap: Record<string, number> = ((txResult.data ?? []) as any[]).reduce((acc: any, t: any) => {
    acc[t.investment_id] = (acc[t.investment_id] ?? 0) + 1;
    return acc;
  }, {});

  const enrichedInvestments = (investments ?? []).map((inv: any) => ({
    investment_id: inv.investment_id,
    name: inv.company_name || inv.company_pools?.pool_name || "Unnamed",
    total_amount: inv.total_amount,
    created_at: inv.created_at,
    transaction_count: txCountMap[inv.investment_id] ?? 0,
  }));

  const enrichedPayouts = ((payoutsResult.data ?? []) as any[]).map((p: any) => {
    const inv = (investments ?? []).find((i: any) => i.investment_id === p.investment_id) as any;
    return {
      payment_id: p.payment_id,
      investment_id: p.investment_id,
      asset_name: inv?.company_name || inv?.company_pools?.pool_name || "-",
      quarter_year: (p.quarterly_roi_declarations as any)?.quarter_year ?? "-",
      gross_roi_amount: p.gross_roi_amount,
      emergency_fund_deduction: p.emergency_fund_deduction,
      tds_deduction: p.tds_deduction,
      net_payable_amount: p.net_payable_amount,
      payment_date: p.payment_date,
      payment_reference: p.payment_reference,
      is_tds_filed: p.is_tds_filed,
      receipt_url: p.receipt_url,
      remarks: p.remarks,
    };
  });

  const totalDeployed = enrichedInvestments.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalReceived = enrichedPayouts.filter(p => p.payment_date).reduce((s, p) => s + Number(p.net_payable_amount), 0);
  const pendingPayouts = enrichedPayouts.filter(p => !p.payment_date).reduce((s, p) => s + Number(p.net_payable_amount), 0);

  return NextResponse.json({
    investor: { ...investor, email },
    investments: enrichedInvestments,
    payouts: enrichedPayouts,
    stats: { totalDeployed, totalReceived, pendingPayouts },
  });
}
