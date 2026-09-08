import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import InvestorDetailClient from "./InvestorDetailClient";

export const dynamic = "force-dynamic";

async function getInvestorDetail(investorId: string) {
  const { data: investor, error } = await supabaseAdmin
    .from("investors")
    .select("investor_id, user_id, investor_name, phone, pan_number, is_active, requires_password_change, associate_name")
    .eq("investor_id", investorId)
    .single();

  if (error || !investor) return null;

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const email = authUsers?.users.find(u => u.id === investor.user_id)?.email ?? "";

  // Filter by investor_id, not user_id - some investors (e.g. debt-only investors added
  // by admin) have no linked auth account, so investor_investments.user_id is null for them.
  const { data: investments } = await supabaseAdmin
    .from("investor_investments")
    .select("investment_id, total_amount, company_name, agreement_url, created_at, debt_terms, company_pools ( pool_name, pool_type )")
    .eq("investor_id", investor.investor_id)
    .order("created_at", { ascending: false });

  const investmentIds = (investments ?? []).map((i: any) => i.investment_id);

  const [txResult, payoutsResult] = await Promise.all([
    investmentIds.length > 0
      ? supabaseAdmin.from("investor_transactions").select("investment_id").in("investment_id", investmentIds)
      : Promise.resolve({ data: [] }),
    investmentIds.length > 0
      ? supabaseAdmin
          .from("investor_quarterly_payments")
          .select("payment_id, investment_id, gross_roi_amount, tds_deduction, emergency_fund_deduction, net_payable_amount, payment_date, payment_reference, receipt_url, remarks, is_tds_filed, months_considered, created_at, quarterly_roi_declarations ( quarter_year, roi_percentage )")
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
    agreement_url: inv.agreement_url ?? null,
    created_at: inv.created_at,
    transaction_count: txCountMap[inv.investment_id] ?? 0,
    debt_terms: inv.company_pools?.pool_type === "debt" ? inv.debt_terms ?? null : null,
  }));

  const enrichedPayouts = ((payoutsResult.data ?? []) as any[]).map((p: any) => {
    const inv = (investments ?? []).find((i: any) => i.investment_id === p.investment_id) as any;
    return {
      payment_id: p.payment_id,
      investment_id: p.investment_id,
      asset_name: inv?.company_name || inv?.company_pools?.pool_name || "-",
      quarter_year: (p.quarterly_roi_declarations as any)?.quarter_year ?? "-",
      roi_percentage: (p.quarterly_roi_declarations as any)?.roi_percentage ?? null,
      gross_roi_amount: p.gross_roi_amount,
      tds_deduction: p.tds_deduction,
      emergency_fund_deduction: p.emergency_fund_deduction,
      net_payable_amount: p.net_payable_amount,
      months_considered: p.months_considered ?? null,
      payment_date: p.payment_date,
      payment_reference: p.payment_reference,
      receipt_url: p.receipt_url,
      remarks: p.remarks,
      is_tds_filed: p.is_tds_filed,
    };
  });

  const paidPayouts = enrichedPayouts.filter(p => p.payment_date);
  const totalDeployed = enrichedInvestments.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalReceived = paidPayouts.reduce((s, p) => s + Number(p.net_payable_amount), 0);
  const totalTds = paidPayouts.reduce((s, p) => s + Number(p.tds_deduction), 0);
  const totalEf = paidPayouts.reduce((s, p) => s + Number(p.emergency_fund_deduction), 0);
  const totalGross = paidPayouts.reduce((s, p) => s + Number(p.gross_roi_amount), 0);
  const pendingPayouts = enrichedPayouts.filter(p => !p.payment_date).reduce((s, p) => s + Number(p.net_payable_amount), 0);

  const netPaidPerInvestment: Record<string, number> = paidPayouts.reduce((acc: Record<string, number>, p) => {
    acc[p.investment_id] = (acc[p.investment_id] ?? 0) + Number(p.net_payable_amount);
    return acc;
  }, {});

  // Build timeline: combine investments + payouts into chronological events
  const timeline = [
    ...enrichedInvestments.map(inv => ({
      type: "investment" as const,
      date: inv.created_at,
      title: `Invested in ${inv.name}`,
      amount: inv.total_amount,
      meta: null,
    })),
    ...enrichedPayouts.filter(p => p.payment_date).map(p => ({
      type: "payout" as const,
      date: p.payment_date!,
      title: `Payout - ${p.quarter_year}`,
      amount: p.net_payable_amount,
      meta: p.asset_name,
    })),
    ...enrichedPayouts.filter(p => !p.payment_date).map(p => ({
      type: "pending_payout" as const,
      date: p.remarks ?? new Date().toISOString(),
      title: `Pending Payout - ${p.quarter_year}`,
      amount: p.net_payable_amount,
      meta: p.asset_name,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    investor: { ...investor, email },
    investments: enrichedInvestments,
    payouts: enrichedPayouts,
    stats: { totalDeployed, totalReceived, totalTds, totalEf, totalGross, pendingPayouts },
    netPaidPerInvestment,
    timeline,
  };
}

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) notFound();

  const { id } = await params;
  const detail = await getInvestorDetail(id);
  if (!detail) notFound();

  return <InvestorDetailClient {...detail} />;
}
