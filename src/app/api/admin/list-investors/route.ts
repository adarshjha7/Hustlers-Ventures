import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("investors")
    .select("investor_id, investor_name, user_id, email, phone, pan_number")
    .order("investor_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ investors: data ?? [] });
}
