import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MIN_COHORT = 5; // don't show stat if fewer investors

export async function GET() {
  // Verify caller is an authenticated investor
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all investment records (user_id + created_at only — no PII)
  const { data, error } = await supabaseAdmin
    .from("investor_investments")
    .select("user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ hasEnoughData: false });

  // Group by investor
  const byUser = new Map<string, string[]>();
  for (const row of data) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
    byUser.get(row.user_id)!.push(row.created_at);
  }

  const totalInvestors = byUser.size;

  if (totalInvestors < MIN_COHORT) {
    return NextResponse.json({ hasEnoughData: false, totalInvestors });
  }

  const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
  let diversifiedCount = 0;       // investors with 2+ assets
  let within6mCount = 0;          // diversified within 6 months of first investment
  let totalAssets = 0;

  for (const dates of byUser.values()) {
    totalAssets += dates.length;
    if (dates.length >= 2) {
      diversifiedCount++;
      const firstMs = new Date(dates[0]).getTime();
      const secondMs = new Date(dates[1]).getTime();
      if (secondMs - firstMs <= SIX_MONTHS_MS) within6mCount++;
    }
  }

  return NextResponse.json({
    hasEnoughData: true,
    totalInvestors,
    diversifiedPct: Math.round((diversifiedCount / totalInvestors) * 100),
    within6mPct: diversifiedCount > 0 ? Math.round((within6mCount / diversifiedCount) * 100) : 0,
    avgAssets: parseFloat((totalAssets / totalInvestors).toFixed(1)),
    diversifiedCount,
  });
}
