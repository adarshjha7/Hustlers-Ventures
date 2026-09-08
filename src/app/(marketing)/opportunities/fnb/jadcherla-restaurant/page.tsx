import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JadcherlaRestaurantPage from "./_client";

export const revalidate = 3600;

export default async function Page() {
  let filledPct: number | null = null;
  const { data: opp } = await supabaseAdmin
    .from("opportunities")
    .select("pool_id, total_pool_size, filled_pct, company_pools ( total_cost )")
    .eq("slug", "jadcherla-restaurant")
    .single();
  if (opp) {
    if (opp.filled_pct != null) {
      filledPct = Number(opp.filled_pct);
    } else if (opp.pool_id) {
      const { data: invData } = await supabaseAdmin
        .from("investor_investments")
        .select("total_amount")
        .eq("purchase_id", opp.pool_id);
      const invested = (invData ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);
      const totalCost = opp.total_pool_size ?? (opp.company_pools as any)?.total_cost;
      if (invested > 0 && totalCost) filledPct = Math.min(100, (invested / Number(totalCost)) * 100);
    }
  }
  return <JadcherlaRestaurantPage filledPct={filledPct} />;
}
