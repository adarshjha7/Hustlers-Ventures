import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select(`
      id, title, slug, tagline, description,
      min_investment, target_irr, tenure, total_pool_size, filled_pct,
      pool_id, company_name, image_url, brochure_url, detail_url,
      is_public, status, sort_order, volatility_level, volatility_note,
      opportunity_categories ( id, name, slug ),
      company_pools ( pool_name, investor_amount, total_cost )
    `)
    .eq("is_for_investor", true)
    .in("status", ["active", "coming_soon"])
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Batch-fetch actual invested totals from investor_investments
  const poolIds = (data ?? []).map((o: any) => o.pool_id).filter(Boolean) as string[];
  let investedByPool: Record<string, number> = {};
  if (poolIds.length > 0) {
    const { data: invData } = await supabaseAdmin
      .from("investor_investments")
      .select("purchase_id, total_amount")
      .in("purchase_id", poolIds);
    investedByPool = (invData ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.purchase_id] = (acc[row.purchase_id] ?? 0) + Number(row.total_amount);
      return acc;
    }, {});
  }

  const enriched = (data ?? []).map((o: any) => {
    const pool = o.company_pools;
    const totalCost = o.total_pool_size ?? pool?.total_cost;
    const investedTotal = o.pool_id ? (investedByPool[o.pool_id] ?? null) : null;
    const filledPct = o.filled_pct != null
      ? Number(o.filled_pct)
      : totalCost && investedTotal != null
        ? Math.min(100, (investedTotal / Number(totalCost)) * 100)
        : null;
    return {
      ...o,
      min_investment: o.min_investment ?? 500000,
      target_irr: o.target_irr ?? 23,
      pool_name: pool?.pool_name ?? null,
      computed_filled_pct: filledPct,
      company_pools: undefined,
    };
  });

  return NextResponse.json({ opportunities: enriched });
}
