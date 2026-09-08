import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET — per-investor login report: associate name, whether they've ever logged in,
// and their last login date/time (from Supabase auth, not system_logs).
export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: investors, error }, { data: authData }] = await Promise.all([
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, associate_name, user_id, is_active")
      .order("investor_name"),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authMap = new Map((authData?.users ?? []).map(u => [u.id, u]));

  const report = (investors ?? []).map(inv => {
    const authUser = authMap.get(inv.user_id);
    const lastSignInAt = authUser?.last_sign_in_at ?? null;
    return {
      investor_id: inv.investor_id,
      investor_name: inv.investor_name,
      associate_name: inv.associate_name,
      email: authUser?.email ?? "",
      is_active: inv.is_active,
      loggedIn: !!lastSignInAt,
      lastSignInAt,
    };
  });

  return NextResponse.json({ report });
}
