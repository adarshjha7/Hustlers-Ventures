import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const investorId = url.searchParams.get("investor_id");
  const purchaseId = url.searchParams.get("purchase_id");
  if (!investorId || !purchaseId) {
    return NextResponse.json(
      { error: "investor_id and purchase_id are required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("investor_investments")
    .select("investment_id, total_amount, created_at, status")
    .eq("investor_id", investorId)
    .eq("purchase_id", purchaseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ investments: data ?? [] });
}
