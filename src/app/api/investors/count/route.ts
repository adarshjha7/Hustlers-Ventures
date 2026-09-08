import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/investors/count
 *
 * Public, unauthenticated — returns only a headcount (active investors),
 * no PII. Powers the homepage's "Family of N Investors" splash animation
 * (src/app/(marketing)/page.tsx) with a real, live number instead of the
 * hardcoded "80+" used in on-page marketing copy elsewhere on the site.
 */
export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("investors")
    .select("investor_id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: count ?? 0 });
}
