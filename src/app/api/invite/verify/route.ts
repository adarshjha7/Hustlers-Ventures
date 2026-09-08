import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf-8");
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const expectedSig = createHmac("sha256", process.env.OTP_SECRET!).update(payload).digest("hex");
  if (sig !== expectedSig) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  const [investorId, phone, expiryStr] = payload.split(":");
  if (!investorId || !phone || !expiryStr) return NextResponse.json({ error: "Invalid token." }, { status: 400 });

  if (Date.now() > parseInt(expiryStr, 10)) {
    return NextResponse.json({ error: "This invite link has expired. Please ask your associate for a new one." }, { status: 400 });
  }

  // The token itself stays cryptographically valid for its full window regardless of what's
  // happened since it was issued — check whether this investor has actually already
  // completed registration, so a reused/bookmarked link doesn't reopen the form for someone
  // who's already registered (submitting again would just fail with a duplicate-account error).
  const { data: investor } = await supabaseAdmin
    .from("investors")
    .select("user_id")
    .eq("investor_id", investorId)
    .maybeSingle();
  if (investor?.user_id) {
    return NextResponse.json({ error: "You've already completed registration. Please log in instead.", alreadyRegistered: true }, { status: 400 });
  }

  return NextResponse.json({ phone });
}
