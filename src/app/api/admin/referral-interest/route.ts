import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data, error }, { data: authData }] = await Promise.all([
    supabaseAdmin
      .from("referral_interest")
      .select(`id, user_id, created_at, investors(investor_id, investor_name, phone)`)
      .order("created_at", { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const emailMap = new Map((authData?.users ?? []).map(u => [u.id, u.email ?? null]));

  const enriched = (data ?? []).map(row => ({
    id: row.id,
    created_at: row.created_at,
    investor_name: (row.investors as { investor_name?: string } | null)?.investor_name ?? "Unknown",
    investor_id:   (row.investors as { investor_id?: string } | null)?.investor_id ?? null,
    phone:         (row.investors as { phone?: string } | null)?.phone ?? null,
    email:         emailMap.get(row.user_id) ?? null,
  }));

  return NextResponse.json({ data: enriched, total: enriched.length });
}
