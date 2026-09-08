import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET - all investments enriched with investor name + transaction count
// GET ?userId=xxx - investments for a specific investor (used by transaction modal)
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId");
  const poolId = req.nextUrl.searchParams.get("poolId");

  if (poolId) {
    const [{ data: investments, error }, { data: investors }] = await Promise.all([
      supabaseAdmin
        .from("investor_investments")
        .select("investment_id, total_amount, investor_id, created_at, debt_terms")
        .eq("purchase_id", poolId)
        .order("total_amount", { ascending: false }),
      supabaseAdmin.from("investors").select("user_id, investor_id, investor_name, email, phone, associate_name"),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Keyed by investor_id, not user_id - debt-only investors often have no linked
    // auth account (user_id = null), which would otherwise collide them all together.
    const investorMap: Record<string, any> = (investors ?? []).reduce((acc: any, inv: any) => {
      acc[inv.investor_id] = inv;
      return acc;
    }, {});

    const enriched = (investments ?? []).map((inv: any) => ({
      investment_id: inv.investment_id,
      total_amount: inv.total_amount,
      investor_name: investorMap[inv.investor_id]?.investor_name ?? "-",
      investor_id: inv.investor_id ?? "",
      email: investorMap[inv.investor_id]?.email ?? "",
      phone: investorMap[inv.investor_id]?.phone ?? null,
      associate_name: investorMap[inv.investor_id]?.associate_name ?? null,
      created_at: inv.created_at,
      debt_terms: inv.debt_terms ?? null,
    }));

    return NextResponse.json({ investments: enriched });
  }

  if (userId) {
    // Scoped fetch for a single investor (transaction modal)
    const { data, error } = await supabaseAdmin
      .from("investor_investments")
      .select("investment_id, total_amount, company_name, created_at, company_pools ( pool_name )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const investments = (data ?? []).map((inv: any) => ({
      investment_id: inv.investment_id,
      total_amount: inv.total_amount,
      name: inv.company_name || inv.company_pools?.pool_name || "Unnamed Investment",
      created_at: inv.created_at,
    }));

    return NextResponse.json({ investments });
  }

  // Full list - enriched with investor name + transaction count
  const [
    { data: investments, error: invError },
    { data: investors },
    { data: txRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("investor_investments")
      .select("investment_id, total_amount, company_name, agreement_url, created_at, user_id, investor_id, purchase_id, company_pools ( pool_name )")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, email"),
    supabaseAdmin
      .from("investor_transactions")
      .select("investment_id"),
  ]);

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 });

  const investorMap: Record<string, { investor_name: string; investor_id: string; email: string }> =
    (investors ?? []).reduce((acc: any, inv: any) => { acc[inv.investor_id] = inv; return acc; }, {});

  const txCountMap: Record<string, number> =
    (txRows ?? []).reduce((acc: any, t: any) => { acc[t.investment_id] = (acc[t.investment_id] ?? 0) + 1; return acc; }, {});

  const enriched = (investments ?? []).map((inv: any) => ({
    investment_id: inv.investment_id,
    total_amount: inv.total_amount,
    name: inv.company_name || inv.company_pools?.pool_name || "Unnamed",
    company_name: inv.company_name ?? null,
    pool_id: inv.purchase_id ?? null, // legacy: kept as alias of purchase_id
    purchase_id: inv.purchase_id ?? null,
    pool_name: inv.company_pools?.pool_name ?? null,
    agreement_url: inv.agreement_url ?? null,
    created_at: inv.created_at,
    user_id: inv.user_id,
    investor_name: investorMap[inv.investor_id]?.investor_name ?? "-",
    investor_id: inv.investor_id ?? "",
    email: investorMap[inv.investor_id]?.email ?? "",
    transaction_count: txCountMap[inv.investment_id] ?? 0,
  }));

  return NextResponse.json({ investments: enriched });
}

// POST - create investment + initial capital transaction (matches multi-step flow's shape).
//
// Insert flow:
//   1. Look up investor_id from user_id (the form sends auth user_id)
//   2. If poolId provided, look up pool.investor_amount for the percentage calc
//   3. Insert investor_investments row (purchase_id is the real FK column)
//   4. Insert an initial investor_transactions row (transaction_type='add')
//   5. The DB trigger on investor_transactions populates investor_investments.total_amount
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investorId, poolId, companyName, amount, investedDate, remarks, debtRoiPercentage, debtTermMonths, debtPaymentCycle } = await req.json();

  if (!investorId || !amount || (!poolId && !companyName)) {
    return NextResponse.json(
      { error: "Investor, amount, and either a pool or a company name are required." },
      { status: 400 }
    );
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) {
    return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
  }

  // 1. Resolve user_id from investor_id — null is expected/allowed for investors who
  // haven't completed registration yet (invite sent, no login). The investment is still
  // created against investor_id; user_id gets backfilled automatically once they register.
  const { data: investorRow } = await supabaseAdmin
    .from("investors")
    .select("user_id")
    .eq("investor_id", investorId)
    .maybeSingle();
  if (!investorRow) {
    return NextResponse.json({ error: "Investor not found." }, { status: 404 });
  }
  const userId = investorRow.user_id ?? null;

  // 2. If a pool is selected, fetch its investor_amount + type for the percentage and debt terms.
  let investment_percentage = 0;
  let poolType: string | null = null;
  if (poolId) {
    const { data: pool } = await supabaseAdmin
      .from("company_pools")
      .select("investor_amount, pool_type")
      .eq("purchase_id", poolId)
      .maybeSingle();
    const poolAmount = Number(pool?.investor_amount ?? 0);
    investment_percentage = poolAmount > 0 ? (amt / poolAmount) * 100 : 0;
    poolType = pool?.pool_type ?? null;
  }

  // 3. Insert investor_investments row. Note `purchase_id` (real FK column) - not `pool_id`.
  const createdAt = investedDate
    ? new Date(investedDate).toISOString()
    : new Date().toISOString();

  // Debt pools carry per-investment loan terms (fixed ROI, tenure, payment cycle) instead of
  // relying on the pool-wide quarterly ROI declaration. generate_quarterly_payments() reads
  // this column directly - see debt_terms on investor_investments.
  const debtTerms = poolType === "debt"
    ? {
        ...(debtRoiPercentage ? { fixed_roi_percentage: Number(debtRoiPercentage) } : {}),
        ...(debtTermMonths ? { term_months: Number(debtTermMonths) } : {}),
        ...(debtPaymentCycle ? { payment_cycle: debtPaymentCycle } : {}),
        loan_start_date: createdAt.split("T")[0],
      }
    : undefined;

  const { data: invData, error: invErr } = await supabaseAdmin
    .from("investor_investments")
    .insert({
      user_id: userId,
      investor_id: investorId,
      purchase_id: poolId || null,
      company_name: companyName || null,
      total_amount: 0, // trigger on investor_transactions updates this
      investment_percentage,
      status: "sent",
      created_at: createdAt,
      ...(debtTerms ? { debt_terms: debtTerms } : {}),
    })
    .select("investment_id")
    .single();

  if (invErr) {
    console.error("[admin/investments] investment insert failed:", invErr.message);
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }

  // Defensive re-assert: something (likely the same trigger that syncs total_amount from
  // investor_transactions) has been observed clobbering user_id back to null on insert even
  // though it's set correctly above. Force it back explicitly so investments reliably show
  // up on the investor's dashboard. Remove once the underlying trigger is found and fixed.
  if (userId) {
    const { error: reassertErr } = await supabaseAdmin
      .from("investor_investments")
      .update({ user_id: userId })
      .eq("investment_id", invData.investment_id);
    if (reassertErr) {
      console.error("[admin/investments] user_id re-assert failed:", reassertErr.message);
    }
  }

  // 4. Insert the initial capital transaction (matches multi-step's pattern).
  const { error: txErr } = await supabaseAdmin
    .from("investor_transactions")
    .insert({
      investment_id: invData.investment_id,
      investment_amount: amt,
      transaction_type: "add",
      created_at: createdAt,
      remarks: remarks || null,
    });

  if (txErr) {
    console.error("[admin/investments] transaction insert failed:", txErr.message);
    // Investment row exists but no transaction → return error so admin knows to retry.
    return NextResponse.json(
      {
        error: `Investment created but initial transaction failed: ${txErr.message}`,
        investmentId: invData.investment_id,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, investmentId: invData.investment_id });
}

// DELETE - remove an investment record (cascades to investor_transactions)
export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investmentId } = await req.json();
  if (!investmentId) return NextResponse.json({ error: "Investment ID is required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("investor_investments")
    .delete()
    .eq("investment_id", investmentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
