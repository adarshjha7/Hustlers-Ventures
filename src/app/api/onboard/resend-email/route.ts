import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendCredentialsEmail } from "@/lib/email";

export async function POST(req: Request) {
  let body: { investorId?: unknown };
  try {
    body = (await req.json()) as { investorId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const investorId =
    typeof body.investorId === "string" ? body.investorId : "";
  if (!investorId) {
    return NextResponse.json({ error: "investorId required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: investor } = await admin
    .from("investors")
    .select("investor_name, email, user_id")
    .eq("investor_id", investorId)
    .maybeSingle();

  if (!investor || !investor.email || !investor.user_id) {
    return NextResponse.json({ error: "Investor not found or not provisioned." }, { status: 404 });
  }

  const defaultPassword =
    process.env.DEFAULT_INVESTOR_PASSWORD || "Hustlers@2026!";
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`;

  const result = await sendCredentialsEmail({
    to: investor.email,
    name: investor.investor_name ?? "Investor",
    password: defaultPassword,
    loginUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
