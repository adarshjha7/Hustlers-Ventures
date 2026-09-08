import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugFilter = searchParams.get("slug");

  const SELECT = `
    id, title, slug, tagline, description, detail_url,
    min_investment, target_irr, tenure, total_pool_size, filled_pct,
    company_name, image_url, brochure_url, status, sort_order, category_id,
    pool_id, volatility_level, volatility_note,
    whatsapp_number, gallery_folder_id, financial_model,
    opportunity_categories ( id, name, slug ),
    company_pools ( total_cost )
  `;

  const oppQuery = slugFilter
    ? supabaseAdmin.from("opportunities").select(SELECT).eq("is_public", true).eq("slug", slugFilter).limit(1)
    : supabaseAdmin.from("opportunities").select(SELECT).eq("is_public", true).in("status", ["active", "coming_soon"])
        .order("sort_order")
        .order("created_at", { ascending: false });

  const [catResult, oppResult] = await Promise.all([
    supabaseAdmin.from("opportunity_categories").select("id, name, slug, description, sort_order").eq("is_active", true).order("sort_order"),
    oppQuery,
  ]);

  if (catResult.error) return NextResponse.json({ error: catResult.error.message }, { status: 500 });
  if (oppResult.error) return NextResponse.json({ error: oppResult.error.message }, { status: 500 });

  let opps = oppResult.data ?? [];

  // Sorted in memory, not via chained .order() calls - chaining .order("x", { foreignTable })
  // with a plain .order("y") was silently dropping the foreign-table clause (only the last
  // .order() call was taking effect against the live DB). Category order first (matches the
  // category listing pages), then each opportunity's own position within it - otherwise an
  // opportunity from a later category can outrank one from an earlier category here, even
  // though the category pages themselves always group by category.
  if (!slugFilter) {
    const categoryOrder = new Map((catResult.data ?? []).map((c: any) => [c.id, c.sort_order]));
    opps = [...opps].sort((a: any, b: any) => {
      const catDiff = (categoryOrder.get(a.category_id) ?? 999) - (categoryOrder.get(b.category_id) ?? 999);
      if (catDiff !== 0) return catDiff;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }

  // Batch-fetch actual invested totals from investor_investments for all linked pools
  const poolIds = opps.map((o: any) => o.pool_id).filter(Boolean) as string[];
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

  const opportunities = opps.map((o: any) => {
    const totalCost = o.total_pool_size ?? o.company_pools?.total_cost;
    const investedTotal = o.pool_id ? (investedByPool[o.pool_id] ?? null) : null;

    const filledPct =
      o.filled_pct != null
        ? o.filled_pct
        : totalCost && investedTotal != null
          ? Math.min(100, (investedTotal / Number(totalCost)) * 100)
          : null;

    return {
      ...o,
      min_investment: o.min_investment ?? 500000,
      target_irr: o.target_irr ?? 23,
      computed_filled_pct: filledPct,
      company_pools: undefined,
    };
  });

  return NextResponse.json({
    categories: catResult.data ?? [],
    opportunities,
  });
}
