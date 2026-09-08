import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getUser() {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseServer.auth.getUser();
  return user;
}

// GET — check if the current investor has already registered interest
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("referral_interest")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ registered: !!data });
}

// POST — register interest (idempotent via upsert)
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve investor_id for the join to investors table
  const { data: investor } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("referral_interest")
    .upsert(
      { user_id: user.id, investor_id: investor?.investor_id ?? null },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Referral early access registered",
    metadata: { user_id: user.id, investor_id: investor?.investor_id },
  });

  return NextResponse.json({ registered: true });
}
