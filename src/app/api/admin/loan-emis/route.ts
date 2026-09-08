import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const loan_id = searchParams.get("loan_id");
  if (!loan_id) return NextResponse.json({ error: "loan_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("loan_emi_payments")
    .select("*")
    .eq("loan_id", loan_id)
    .order("emi_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-mark overdue: pending EMIs past due date
  const today = new Date().toISOString().slice(0, 10);
  const overdueIds = (data ?? [])
    .filter((e) => e.status === "pending" && e.due_date < today)
    .map((e) => e.emi_id);
  if (overdueIds.length > 0) {
    await supabaseAdmin
      .from("loan_emi_payments")
      .update({ status: "overdue" })
      .in("emi_id", overdueIds);
    for (const row of data ?? []) {
      if (overdueIds.includes(row.emi_id)) row.status = "overdue";
    }
  }

  return NextResponse.json({ emis: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { emi_id, status, paid_date, payment_reference, notes } = body;
  if (!emi_id) return NextResponse.json({ error: "emi_id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (status !== undefined) patch.status = status;
  if (paid_date !== undefined) patch.paid_date = paid_date;
  if (payment_reference !== undefined) patch.payment_reference = payment_reference;
  if (notes !== undefined) patch.notes = notes;

  const { data, error } = await supabaseAdmin
    .from("loan_emi_payments")
    .update(patch)
    .eq("emi_id", emi_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ emi: data });
}
