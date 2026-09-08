import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  let body: { token?: unknown; otp?: unknown };
  try {
    body = (await req.json()) as { token?: unknown; otp?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const otp = typeof body.otp === "string" ? body.otp : "";
  if (!token || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "Missing or malformed token/otp." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("investors")
    .select("invite_otp")
    .eq("invite_token", token)
    .is("user_id", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }
  if (data.invite_otp !== otp) {
    return NextResponse.json({ error: "Wrong code." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
