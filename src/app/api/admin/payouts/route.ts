import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const investmentId = new URL(req.url).searchParams.get("investmentId");

  const [
    { data: payouts, error: payoutsError },
    { data: investments },
    { data: investors },
    { data: declarations },
    { data: authData },
  ] = await Promise.all([
    (investmentId
      ? supabaseAdmin.from("investor_quarterly_payments").select("*").eq("investment_id", investmentId).order("payment_date", { ascending: false })
      : supabaseAdmin.from("investor_quarterly_payments").select("*").order("created_at", { ascending: false })
    ),
    supabaseAdmin
      .from("investor_investments")
      .select("investment_id, user_id, company_name, company_pools ( pool_name )"),
    supabaseAdmin
      .from("investors")
      .select("user_id, investor_id, investor_name"),
    supabaseAdmin
      .from("quarterly_roi_declarations")
      .select("declaration_id, quarter_year, purchase_id, roi_percentage, month_names, company_pools ( pool_name )"),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (payoutsError) return NextResponse.json({ error: payoutsError.message }, { status: 500 });

  const emailMap: Record<string, string> = {};
  (authData as any)?.users?.forEach((u: any) => { emailMap[u.id] = u.email ?? ""; });

  const investmentMap: Record<string, any> = (investments ?? []).reduce((acc: any, inv: any) => {
    acc[inv.investment_id] = inv;
    return acc;
  }, {});
  const investorMap: Record<string, any> = (investors ?? []).reduce((acc: any, inv: any) => {
    acc[inv.user_id] = inv;
    return acc;
  }, {});
  const declarationMap: Record<string, any> = (declarations ?? []).reduce((acc: any, d: any) => {
    acc[d.declaration_id] = d;
    return acc;
  }, {});

  const enriched = (payouts ?? []).map((p: any) => {
    const investment = investmentMap[p.investment_id] ?? null;
    const investor = investment ? investorMap[investment.user_id] ?? null : null;
    const declaration = declarationMap[p.declaration_id] ?? null;

    return {
      payment_id: p.payment_id,
      investment_id: p.investment_id,
      declaration_id: p.declaration_id,
      gross_roi_amount: p.gross_roi_amount,
      emergency_fund_deduction: p.emergency_fund_deduction,
      tds_deduction: p.tds_deduction,
      net_payable_amount: p.net_payable_amount,
      payment_date: p.payment_date,
      payment_reference: p.payment_reference,
      receipt_url: p.receipt_url,
      remarks: p.remarks,
      fd_returns: p.fd_returns,
      months_considered: p.months_considered,
      is_tds_filed: p.is_tds_filed,
      created_at: p.created_at,
      investor_name: investor?.investor_name ?? "-",
      email: emailMap[investment?.user_id ?? ""] ?? "",
      asset_name: declaration?.company_pools?.pool_name || investment?.company_name || investment?.company_pools?.pool_name || "-",
      quarter_year: declaration?.quarter_year ?? "-",
      roi_percentage: declaration?.roi_percentage ?? null,
      pool_name: declaration?.company_pools?.pool_name ?? "",
    };
  });

  return NextResponse.json({ payouts: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const {
    investmentId, declarationId, grossAmount, emergencyFund, tds, netAmount,
    paymentDate, paymentReference, receiptUrl, remarks, fdReturns, monthsConsidered, isTdsFiled,
  } = await req.json();

  if (!investmentId || !declarationId || !grossAmount || netAmount === undefined) {
    return NextResponse.json(
      { error: "Investment, declaration, gross amount, and net amount are required." },
      { status: 400 }
    );
  }

  // CAGR investments reinvest the net payout into their capital instead of receiving cash.
  const { data: investment } = await supabaseAdmin
    .from("investor_investments")
    .select("return_type")
    .eq("investment_id", investmentId)
    .maybeSingle();
  const isCagr = investment?.return_type === "CAGR";

  const { data, error } = await supabaseAdmin
    .from("investor_quarterly_payments")
    .insert({
      investment_id: investmentId,
      declaration_id: declarationId,
      gross_roi_amount: Number(grossAmount),
      emergency_fund_deduction: Number(emergencyFund ?? 0),
      tds_deduction: Number(tds ?? 0),
      net_payable_amount: Number(netAmount),
      payment_date: paymentDate || null,
      payment_reference: paymentReference || null,
      receipt_url: receiptUrl || null,
      remarks: remarks || (isCagr ? "Reinvested into capital (CAGR)" : null),
      fd_returns: fdReturns ? Number(fdReturns) : null,
      months_considered: monthsConsidered ? Number(monthsConsidered) : null,
      is_tds_filed: isTdsFiled ?? false,
      payment_status: paymentDate ? "Paid" : "Pending",
    })
    .select("payment_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reinvest: add the net payout back into their capital instead of disbursing it.
  // trg_sync_investment_total keeps investor_investments.total_amount in sync.
  if (isCagr && paymentDate) {
    const { error: reinvestError } = await supabaseAdmin.from("investor_transactions").insert({
      investment_id: investmentId,
      investment_amount: Number(netAmount),
      transaction_type: "add",
      remarks: `Reinvested payout — ${data.payment_id}`,
    });
    if (reinvestError) {
      await supabaseAdmin.from("system_logs").insert({
        level: "ERROR",
        message: "Failed to reinvest CAGR payout into capital",
        metadata: { investmentId, paymentId: data.payment_id, errorDetails: reinvestError.message },
      });
    }
  }

  return NextResponse.json({ success: true, paymentId: data.payment_id, reinvested: isCagr });
}

export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const {
    paymentId, investmentId, declarationId,
    grossAmount, emergencyFund, tds, netAmount,
    paymentDate, paymentReference, receiptUrl,
    remarks, fdReturns, monthsConsidered, isTdsFiled,
  } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });

  const fields: Record<string, unknown> = {
    payment_date: paymentDate || null,
    payment_reference: paymentReference || null,
    receipt_url: receiptUrl || null,
    is_tds_filed: isTdsFiled ?? false,
    payment_status: paymentDate ? "Paid" : "Pending",
  };

  if (investmentId !== undefined) fields.investment_id = investmentId;
  if (declarationId !== undefined) fields.declaration_id = declarationId;
  if (grossAmount !== undefined) fields.gross_roi_amount = Number(grossAmount);
  if (emergencyFund !== undefined) fields.emergency_fund_deduction = Number(emergencyFund);
  if (tds !== undefined) fields.tds_deduction = Number(tds);
  if (netAmount !== undefined) fields.net_payable_amount = Number(netAmount);
  if (remarks !== undefined) fields.remarks = remarks || null;
  if (fdReturns !== undefined) fields.fd_returns = fdReturns ? Number(fdReturns) : null;
  if (monthsConsidered !== undefined) fields.months_considered = monthsConsidered ? Number(monthsConsidered) : null;

  const { error } = await supabaseAdmin
    .from("investor_quarterly_payments")
    .update(fields)
    .eq("payment_id", paymentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { paymentId } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("investor_quarterly_payments")
    .delete()
    .eq("payment_id", paymentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
