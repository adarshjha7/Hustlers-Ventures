import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("quarterly_roi_declarations")
    .select("declaration_id, quarter_year, roi_percentage, declaration_date, purchase_id, is_finalized, month_names, emergency_fund_deduction_amount, company_pools ( pool_name )")
    .order("declaration_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const declarations = (data ?? []).map((d: any) => ({
    declaration_id: d.declaration_id,
    quarter_year: d.quarter_year,
    roi_percentage: d.roi_percentage,
    declaration_date: d.declaration_date,
    purchase_id: d.purchase_id,
    pool_name: d.company_pools?.pool_name ?? "Unknown Pool",
    is_finalized: d.is_finalized,
    month_names: d.month_names,
    emergency_fund_deduction_amount: d.emergency_fund_deduction_amount,
  }));

  return NextResponse.json({ declarations });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { poolId, quarterYear, roiPercentage, declarationDate, monthNames, emergencyFundAmount } = await req.json();

  if (!poolId || !quarterYear || !roiPercentage || !declarationDate) {
    return NextResponse.json(
      { error: "Pool, quarter year, ROI percentage, and date are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("quarterly_roi_declarations")
    .insert({
      purchase_id: poolId,
      quarter_year: quarterYear,
      roi_percentage: Number(roiPercentage),
      declaration_date: declarationDate,
      month_names: monthNames || null,
      emergency_fund_deduction_amount: emergencyFundAmount ? Number(emergencyFundAmount) : null,
      is_finalized: false,
    })
    .select("declaration_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, declarationId: data.declaration_id });
}

export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { declarationId, poolId, quarterYear, roiPercentage, declarationDate, monthNames, emergencyFundAmount, isFinalized } = await req.json();
  if (!declarationId) return NextResponse.json({ error: "Declaration ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("quarterly_roi_declarations")
    .update({
      purchase_id: poolId,
      quarter_year: quarterYear,
      roi_percentage: Number(roiPercentage),
      declaration_date: declarationDate,
      month_names: monthNames || null,
      emergency_fund_deduction_amount: emergencyFundAmount ? Number(emergencyFundAmount) : null,
      is_finalized: isFinalized ?? false,
    })
    .eq("declaration_id", declarationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { declarationId } = await req.json();
  if (!declarationId) return NextResponse.json({ error: "Declaration ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("quarterly_roi_declarations")
    .delete()
    .eq("declaration_id", declarationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
