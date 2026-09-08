import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("company_pools")
    .select("purchase_id, pool_name, pool_type, description, owner_names, vehicle_numbers, purchase_date, total_cost, bank_loan_amount, investor_amount, monthly_emi, emergency_fund_collected, emergency_fund_company_share, emergency_fund_investor_share, emergency_fund_remaining, status, organization_name, gstin, category_name, category_id, receipt_id, business_purposes, created_at, opportunity_categories(id, name, slug)")
    .order("pool_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pools: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    poolName, description, ownerNames, vehicleNumbers, purchaseDate,
    totalCost, bankLoanAmount, investorAmount, monthlyEmi,
    emergencyFundCollected, emergencyFundCompanyShare, emergencyFundInvestorShare, emergencyFundRemaining,
    status, organizationName, gstin, categoryName, categoryId, receiptId, businessPurposes,
  } = body;

  if (!poolName || !ownerNames?.length || !vehicleNumbers?.length || !purchaseDate || !totalCost || !bankLoanAmount || !investorAmount || !monthlyEmi) {
    return NextResponse.json({ error: "Pool name, owners, vehicles, date, and all financial fields are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("company_pools")
    .insert({
      pool_name: poolName,
      description: description || null,
      owner_names: ownerNames.filter(Boolean),
      vehicle_numbers: vehicleNumbers.filter(Boolean),
      purchase_date: purchaseDate,
      total_cost: Number(totalCost),
      bank_loan_amount: Number(bankLoanAmount),
      investor_amount: Number(investorAmount),
      monthly_emi: Number(monthlyEmi),
      emergency_fund_collected: Number(emergencyFundCollected ?? 0),
      emergency_fund_company_share: Number(emergencyFundCompanyShare ?? 0),
      emergency_fund_investor_share: Number(emergencyFundInvestorShare ?? 0),
      emergency_fund_remaining: Number(emergencyFundRemaining ?? 0),
      status: status || "Active",
      organization_name: organizationName || null,
      gstin: gstin || null,
      category_name: categoryName || null,
      category_id: categoryId || null,
      receipt_id: receiptId || null,
      business_purposes: businessPurposes || null,
    })
    .select("purchase_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, purchaseId: data.purchase_id });
}

export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    purchaseId, poolName, description, ownerNames, vehicleNumbers, purchaseDate,
    totalCost, bankLoanAmount, investorAmount, monthlyEmi,
    emergencyFundCollected, emergencyFundCompanyShare, emergencyFundInvestorShare, emergencyFundRemaining,
    status, organizationName, gstin, categoryName, categoryId, receiptId, businessPurposes,
  } = body;

  if (!purchaseId) return NextResponse.json({ error: "Purchase ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("company_pools")
    .update({
      pool_name: poolName,
      description: description || null,
      owner_names: ownerNames.filter(Boolean),
      vehicle_numbers: vehicleNumbers.filter(Boolean),
      purchase_date: purchaseDate,
      total_cost: Number(totalCost),
      bank_loan_amount: Number(bankLoanAmount),
      investor_amount: Number(investorAmount),
      monthly_emi: Number(monthlyEmi),
      emergency_fund_collected: Number(emergencyFundCollected ?? 0),
      emergency_fund_company_share: Number(emergencyFundCompanyShare ?? 0),
      emergency_fund_investor_share: Number(emergencyFundInvestorShare ?? 0),
      emergency_fund_remaining: Number(emergencyFundRemaining ?? 0),
      status: status || "Active",
      organization_name: organizationName || null,
      gstin: gstin || null,
      category_name: categoryName || null,
      category_id: categoryId || null,
      receipt_id: receiptId || null,
      business_purposes: businessPurposes || null,
    })
    .eq("purchase_id", purchaseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { purchaseId } = await req.json();
  if (!purchaseId) return NextResponse.json({ error: "Purchase ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("company_pools")
    .delete()
    .eq("purchase_id", purchaseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
