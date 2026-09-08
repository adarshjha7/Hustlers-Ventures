import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET ?investmentId=xxx - list transactions for an investment
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const investmentId = req.nextUrl.searchParams.get("investmentId");
  if (!investmentId) return NextResponse.json({ error: "investmentId is required." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("investor_transactions")
    .select("transaction_id, investment_amount, transaction_type, remarks, receipt_url, created_at")
    .eq("investment_id", investmentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data ?? [] });
}

// POST - create transaction
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investmentId, amount, transactionType, remarks, receiptUrl, createdAt } = await req.json();

  if (!investmentId || !amount || !transactionType) {
    return NextResponse.json({ error: "Investment, amount, and transaction type are required." }, { status: 400 });
  }

  if (!["add", "withdrawal"].includes(transactionType)) {
    return NextResponse.json({ error: "Transaction type must be 'add' or 'withdrawal'." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("investor_transactions")
    .insert({
      investment_id: investmentId,
      investment_amount: Number(amount),
      transaction_type: transactionType,
      remarks: remarks || null,
      receipt_url: receiptUrl || null,
      created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE - remove a transaction
export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { transactionId } = await req.json();
  if (!transactionId) return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("investor_transactions")
    .delete()
    .eq("transaction_id", transactionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
