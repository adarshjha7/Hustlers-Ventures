import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST — investor confirms their issue is solved. Only valid from IN_PROGRESS (the state the
// "has this been resolved?" prompt is shown in) — this is the only path that closes a thread.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A login can map to more than one investor profile (e.g. a shared family/associate
  // login) — fetch all matches rather than .maybeSingle(), which errors on >1 row.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", user.id);
  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor profile not found." }, { status: 404 });
  const investorIds = investors.map(i => i.investor_id);

  const { data: thread } = await supabaseAdmin
    .from("support_threads")
    .select("id, status")
    .eq("id", id)
    .in("investor_id", investorIds)
    .maybeSingle();
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  if (thread.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Only an in-progress request can be marked resolved." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("support_threads").update({ status: "CLOSED" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
