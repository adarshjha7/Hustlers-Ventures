import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Generate EMI schedule using reducing-balance method
function generateEmiSchedule(
  loanId: string,
  principal: number,
  annualRate: number,
  tenureMonths: number,
  disbursalDate: string
) {
  const r = annualRate / 100 / 12;
  const emi =
    r === 0
      ? principal / tenureMonths
      : (principal * r * Math.pow(1 + r, tenureMonths)) /
        (Math.pow(1 + r, tenureMonths) - 1);

  const rows = [];
  let outstanding = principal;
  const start = new Date(disbursalDate);

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);
    const interest = outstanding * r;
    const principalComp = Math.min(emi - interest, outstanding);
    outstanding = Math.max(0, outstanding - principalComp);

    rows.push({
      loan_id: loanId,
      emi_number: i,
      due_date: dueDate.toISOString().slice(0, 10),
      emi_amount: parseFloat(emi.toFixed(2)),
      principal_component: parseFloat(principalComp.toFixed(2)),
      interest_component: parseFloat(interest.toFixed(2)),
      outstanding_principal: parseFloat(outstanding.toFixed(2)),
      status: "pending",
    });
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const loanId = searchParams.get("loan_id");

  if (loanId) {
    const { data, error } = await supabaseAdmin
      .from("loans")
      .select("*, company_pools ( pool_name )")
      .eq("loan_id", loanId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ loan: data });
  }

  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("*, company_pools ( pool_name )")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ loans: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { borrower_name, loan_type, principal, interest_rate, tenure_months, disbursal_date, pool_id, notes, contact_phone } = body;

  if (!borrower_name || !loan_type || !principal || !interest_rate || !tenure_months || !disbursal_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const maturityDate = new Date(disbursal_date);
  maturityDate.setMonth(maturityDate.getMonth() + Number(tenure_months));
  const maturity_date = maturityDate.toISOString().slice(0, 10);

  const { data: loan, error } = await supabaseAdmin
    .from("loans")
    .insert({
      borrower_name,
      loan_type,
      principal: Number(principal),
      interest_rate: Number(interest_rate),
      tenure_months: Number(tenure_months),
      disbursal_date,
      maturity_date,
      pool_id: pool_id || null,
      notes: notes || null,
      contact_phone: contact_phone || null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-generate EMI schedule
  const schedule = generateEmiSchedule(
    loan.loan_id,
    Number(principal),
    Number(interest_rate),
    Number(tenure_months),
    disbursal_date
  );
  const { error: emiError } = await supabaseAdmin.from("loan_emi_payments").insert(schedule);
  if (emiError) return NextResponse.json({ error: emiError.message }, { status: 500 });

  await supabaseAdmin.from("system_logs").insert({
    event_type: "loan_created",
    description: `Loan created: ${borrower_name} — ${loan_type} — ₹${principal}`,
    metadata: { loan_id: loan.loan_id },
  });

  return NextResponse.json({ loan }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { loan_id, ...updates } = body;
  if (!loan_id) return NextResponse.json({ error: "loan_id required" }, { status: 400 });

  const allowed = ["borrower_name", "loan_type", "pool_id", "notes", "status", "contact_phone"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in updates) patch[k] = updates[k];

  const { data, error } = await supabaseAdmin
    .from("loans")
    .update(patch)
    .eq("loan_id", loan_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ loan: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const loan_id = searchParams.get("loan_id");
  if (!loan_id) return NextResponse.json({ error: "loan_id required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("loans").delete().eq("loan_id", loan_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
