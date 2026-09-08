import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const investor_id = String(body.investor_id ?? "").trim();
  const passed_user_id: string | null = body.user_id ? String(body.user_id).trim() : null;
  const purchase_id = String(body.purchase_id ?? "").trim();
  let investment_id: string | null = body.investment_id
    ? String(body.investment_id)
    : null;
  const amount = Number(body.amount);
  const transaction_type = String(body.transaction_type ?? "").toLowerCase();
  const transaction_date = String(body.transaction_date ?? "");
  const remarks = body.remarks ? String(body.remarks).trim() : null;

  if (!investor_id || !purchase_id) {
    return NextResponse.json(
      { error: "investor_id and purchase_id required." },
      { status: 400 }
    );
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
  }
  if (transaction_type !== "add" && transaction_type !== "withdrawal") {
    return NextResponse.json({ error: "Invalid transaction type." }, { status: 400 });
  }

  const admin = createAdminClient();

  // If creating a new investment, insert the investment row first.
  if (!investment_id) {
    // Look up pool's investor_amount to compute percentage.
    const { data: pool } = await admin
      .from("company_pools")
      .select("investor_amount")
      .eq("purchase_id", purchase_id)
      .maybeSingle();

    const poolAmount = Number(pool?.investor_amount ?? 0);
    const investment_percentage =
      poolAmount > 0 ? (amount / poolAmount) * 100 : 0;

    // Resolve user_id: prefer value passed by client, fall back to DB lookup.
    // A null user_id is expected for investors who haven't completed registration yet
    // (invite sent, investor_id already exists) — the investment is still created, keyed
    // by investor_id, and user_id gets backfilled automatically once they register.
    let resolved_user_id = passed_user_id;
    if (!resolved_user_id) {
      const { data: investorRow } = await admin
        .from("investors")
        .select("user_id")
        .eq("investor_id", investor_id)
        .maybeSingle();
      resolved_user_id = investorRow?.user_id ?? null;
    }

    const newInvestmentId = crypto.randomUUID();
    const { error: insErr } = await admin.from("investor_investments").insert({
      investment_id: newInvestmentId,
      investor_id,
      user_id: resolved_user_id,
      purchase_id,
      total_amount: 0, // trigger updates this from transactions
      investment_percentage,
      status: "sent",
      created_at: new Date().toISOString(),
    });
    if (insErr) {
      console.error("[create-investment] investment insert failed:", insErr.message);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    investment_id = newInvestmentId;

    // Defensive re-assert: a trigger on this table has been observed clobbering user_id
    // back to null on insert even though it's set correctly above (same issue found in
    // /api/admin/investments). Force it back explicitly. Remove once the underlying
    // trigger is found and fixed.
    if (resolved_user_id) {
      const { error: reassertErr } = await admin
        .from("investor_investments")
        .update({ user_id: resolved_user_id })
        .eq("investment_id", investment_id);
      if (reassertErr) {
        console.error("[create-investment] user_id re-assert failed:", reassertErr.message);
      }
    }
  } else if (transaction_type === "withdrawal") {
    // Validate withdrawal doesn't exceed current balance.
    const { data: existing } = await admin
      .from("investor_investments")
      .select("total_amount")
      .eq("investment_id", investment_id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: "Investment not found." },
        { status: 404 }
      );
    }
    if (amount > Number(existing.total_amount)) {
      return NextResponse.json(
        {
          error: `Withdrawal exceeds current balance (₹${Number(
            existing.total_amount
          ).toLocaleString("en-IN")}).`,
        },
        { status: 400 }
      );
    }
  }

  // Insert the transaction. DB trigger updates investor_investments.total_amount.
  const { error: txErr } = await admin.from("investor_transactions").insert({
    investment_id,
    investment_amount: amount,
    transaction_type,
    created_at: new Date(transaction_date).toISOString(),
    remarks,
  });
  if (txErr) {
    console.error("[create-investment] transaction insert failed:", txErr.message);
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  console.log(
    `[create-investment] ok investment=${investment_id} type=${transaction_type} amt=${amount}`
  );

  return NextResponse.json({ ok: true, investment_id });
}
