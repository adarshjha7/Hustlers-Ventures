import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET — total unread admin messages across all support threads, for the nav badge
export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ count: 0 });

  const { data } = await supabaseAdmin.from("support_threads").select("admin_unread_count");
  const count = (data ?? []).reduce((sum, t: { admin_unread_count: number | null }) => sum + Number(t.admin_unread_count ?? 0), 0);

  return NextResponse.json({ count });
}
