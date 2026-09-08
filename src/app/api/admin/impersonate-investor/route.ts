import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// POST - generate a one-time login for an investor so an admin can view their dashboard,
// without needing (or exposing) the investor's password.
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  // A login can map to more than one investor profile (e.g. a shared family/associate
  // login) — fetch all matches rather than .maybeSingle(), which errors on >1 row.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id, investor_name, is_active")
    .eq("user_id", userId);

  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor not found." }, { status: 404 });
  if (!investors.some(i => i.is_active)) return NextResponse.json({ error: "This investor account is inactive." }, { status: 400 });
  const investorNames = investors.map(i => i.investor_name.trim()).join(" & ");
  const investorIdList = investors.map(i => i.investor_id).join(",");

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (authError || !authUser?.user?.email) {
    return NextResponse.json({ error: "Could not resolve investor's login email." }, { status: 500 });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: linkError?.message || "Could not generate login link." }, { status: 500 });
  }

  await supabaseAdmin.from("system_logs").insert({
    level: "WARN",
    message: "Admin logged in as investor",
    metadata: {
      adminEmail: admin.email,
      investorUserId: userId,
      investorId: investorIdList,
      investorName: investorNames,
      investorEmail: authUser.user.email,
    },
  });

  return NextResponse.json({
    email: authUser.user.email,
    tokenHash: linkData.properties.hashed_token,
  });
}