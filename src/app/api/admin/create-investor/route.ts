import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { formatPhoneE164 } from "@/lib/phone";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const investor_name = s(body.investor_name);
  const email = s(body.email).toLowerCase();
  const phone = formatPhoneE164(s(body.phone));
  const pan_number = s(body.pan).toUpperCase();
  const bank_account_no = s(body.bank_acc);
  const bank_ifsc = s(body.ifsc).toUpperCase();
  const associate_name = s(body.associate) || null;

  if (!investor_name) return NextResponse.json({ error: "Name required." }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });
  if (!phone || !/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Valid phone required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Duplicate detection.
  const { data: dupes } = await admin
    .from("investors")
    .select("investor_id, email, pan_number")
    .or(`email.eq.${email}${pan_number ? `,pan_number.eq.${pan_number}` : ""}`);
  if (dupes && dupes.length > 0) {
    const conflict = dupes[0];
    if (conflict.email === email) {
      return NextResponse.json(
        { error: "An investor with this email already exists." },
        { status: 409 }
      );
    }
    if (pan_number && conflict.pan_number === pan_number) {
      return NextResponse.json(
        { error: "An investor with this PAN already exists." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await admin
    .from("investors")
    .insert({
      investor_id: crypto.randomUUID(),
      investor_name,
      email,
      phone,
      pan_number: pan_number || null,
      bank_account_no: bank_account_no || null,
      bank_ifsc: bank_ifsc || null,
      associate_name,
      is_active: true,
    })
    .select("investor_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, investor_id: data.investor_id });
}
