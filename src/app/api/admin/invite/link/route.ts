import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET ?investorId=xxx — reconstructs the previously-generated invite link from the
// stored token, so an admin can re-copy it instead of generating a brand new one
// (which would sign a fresh 7-day token and require a re-send).
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const investorId = req.nextUrl.searchParams.get("investorId");
  if (!investorId) return NextResponse.json({ error: "investorId is required." }, { status: 400 });

  const { data: investor, error } = await supabaseAdmin
    .from("investors")
    .select("invite_token, user_id")
    .eq("investor_id", investorId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!investor) return NextResponse.json({ error: "Investor not found." }, { status: 404 });
  if (investor.user_id) return NextResponse.json({ error: "This investor has already registered." }, { status: 400 });
  if (!investor.invite_token) return NextResponse.json({ error: "No invite has been sent yet." }, { status: 404 });

  let expired = false;
  try {
    const [encoded] = investor.invite_token.split(".");
    // Token payload is investorId:phone:expiry — expiry is always the last segment.
    const parts = Buffer.from(encoded, "base64url").toString("utf-8").split(":");
    const expiryStr = parts[parts.length - 1];
    expired = Date.now() > parseInt(expiryStr, 10);
  } catch {
    expired = true;
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/register?token=${encodeURIComponent(investor.invite_token)}`;
  return NextResponse.json({ inviteUrl, expired });
}
