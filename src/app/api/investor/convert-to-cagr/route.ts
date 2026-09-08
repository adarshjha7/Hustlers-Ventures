import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { investment_id, password } = await req.json();
  if (!investment_id || !password) {
    return NextResponse.json({ error: "Investment and password are required." }, { status: 400 });
  }

  // Re-verify the investor's password before allowing the conversion
  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error: signInError } = await anonClient.auth.signInWithPassword({ email: user.email, password });
  if (signInError) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Confirm the investment belongs to this investor and is not already on CAGR
  const { data: investment, error: fetchError } = await supabaseAdmin
    .from("investor_investments")
    .select("investment_id, company_name, return_type")
    .eq("investment_id", investment_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !investment) {
    return NextResponse.json({ error: "Investment not found." }, { status: 404 });
  }
  if (investment.return_type === "CAGR") {
    return NextResponse.json({ error: "This asset is already on CAGR." }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("investor_investments")
    .update({ return_type: "CAGR" })
    .eq("investment_id", investment_id)
    .eq("user_id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Investor converted asset return type to CAGR",
    metadata: { userId: user.id, investmentId: investment_id, companyName: investment.company_name },
  });

  return NextResponse.json({ success: true });
}