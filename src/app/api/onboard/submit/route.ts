import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { formatPhoneE164 } from "@/lib/phone";

/**
 * POST /api/onboard/submit
 *
 * Called by the Google Apps Script attached to the onboarding Google Form.
 * Auth: shared secret in `X-Onboarding-Secret` header.
 * Body: { "Full Name": "...", "Phone Number": "...", ... }  (form titles as keys)
 *
 * Flow:
 *   1. Verify shared secret
 *   2. Insert investor row
 *   3. Create or reuse Supabase Auth user with default password
 *   4. Link user_id back to investor
 *   5. Send credentials via WhatsApp (Meta Cloud API)
 *      Email is sent by Apps Script (MailApp.sendEmail) directly, not from here.
 */

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

async function sendCredentialsWhatsApp(
  toPhone: string,
  name: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const templateName = process.env.META_WA_TEMPLATE_CREDENTIALS;
  if (!phoneNumberId || !accessToken || !templateName) {
    return { ok: false, error: "META_WA_TEMPLATE_CREDENTIALS not configured" };
  }
  const cleanPhone = toPhone.replace(/[^\d]/g, "");
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: name },
                  { type: "text", text: email },
                  { type: "text", text: password },
                ],
              },
            ],
          },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message ?? `Meta returned ${res.status}`,
      };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}

export async function POST(req: Request) {
  // 1. Verify Apps Script shared secret.
  const expected = process.env.ONBOARDING_SECRET;
  const provided = req.headers.get("x-onboarding-secret") ?? "";
  if (!expected || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body. Normalize keys (trim whitespace) so trailing-space form titles match.
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const body: Record<string, unknown> = Object.fromEntries(
    Object.entries(rawBody).map(([k, v]) => [k.trim(), v])
  );
  console.log("[onboard] received submission. keys:", Object.keys(body));

  // 3. Map form titles to DB columns.
  const investor_name = s(body["Full Name"]);
  const phone = formatPhoneE164(s(body["Phone Number"]));
  const phoneDigits = phone.replace(/[^\d]/g, "");
  const email = s(body["Email Address"]).toLowerCase();
  const pan_number = s(body["PAN Card Number"]).toUpperCase();
  const bank_account_no = s(body["Bank account number"]);
  const bank_account_no_re = s(body["Re-enter Bank account number"]);
  const bank_ifsc = s(body["IFSC"]).toUpperCase();
  const associate_name = s(body["Associate Name"]) || null;
  console.log("[onboard] parsed:", { investor_name, email, phone, pan_number, bank_ifsc });

  // 4. Validate.
  if (!investor_name || !email || !phoneDigits || !/^\d{8,15}$/.test(phoneDigits)) {
    return NextResponse.json(
      { error: "Missing or invalid required fields (name, email, phone)." },
      { status: 400 }
    );
  }
  if (bank_account_no && bank_account_no_re && bank_account_no !== bank_account_no_re) {
    return NextResponse.json(
      { error: "Bank account number mismatch." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 5. Insert a new investor row.
  const investorId = crypto.randomUUID();
  const { error: insertError } = await admin.from("investors").insert({
    investor_id: investorId,
    investor_name,
    phone,
    email,
    pan_number: pan_number || null,
    bank_account_no: bank_account_no || null,
    bank_ifsc: bank_ifsc || null,
    associate_name,
    is_active: true,
    requires_password_change: true,
  });
  if (insertError) {
    console.error("[onboard] INSERT failed:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  console.log("[onboard] inserted investor:", investorId);

  // 6. Create or reuse the Supabase Auth user.
  const defaultPassword =
    process.env.DEFAULT_INVESTOR_PASSWORD || "Hustlers@2026!";
  let authUserId: string | null = null;

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { source: "onboarding_form", investor_name },
    });

  if (authData?.user) {
    authUserId = authData.user.id;
    console.log("[onboard] auth user created:", authUserId);
  } else if (
    authError?.message?.toLowerCase().includes("registered")
  ) {
    // Email already in auth.users - reuse and reset password to default.
    const { data: list } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (existing) {
      authUserId = existing.id;
      await admin.auth.admin.updateUserById(existing.id, {
        password: defaultPassword,
      });
      console.log("[onboard] reused existing auth user, reset password:", authUserId);
    }
  } else {
    console.error("[onboard] auth user creation failed:", authError?.message);
    return NextResponse.json(
      {
        ok: false,
        investor_id: investorId,
        error: `Investor saved but auth provisioning failed: ${authError?.message ?? "unknown"}`,
      },
      { status: 500 }
    );
  }

  if (!authUserId) {
    return NextResponse.json(
      { ok: false, investor_id: investorId, error: "Could not provision auth user." },
      { status: 500 }
    );
  }

  // 7. Link the new investor row to the auth user.
  await admin
    .from("investors")
    .update({ user_id: authUserId })
    .eq("investor_id", investorId);
  console.log("[onboard] linked user_id to investor row");

  // 8. Send credentials via WhatsApp (email is sent by Apps Script separately).
  const whatsapp = await sendCredentialsWhatsApp(
    phone,
    investor_name,
    email,
    defaultPassword
  );
  if (whatsapp.ok) {
    console.log("[onboard] ✅ WhatsApp credentials sent to", phone);
  } else {
    console.error(`[onboard] ❌ WhatsApp ${whatsapp.ok ? "" : "failed"}:`, whatsapp.ok ? "" : whatsapp.error);
  }

  return NextResponse.json({
    ok: true,
    investor_id: investorId,
    user_id: authUserId,
    whatsapp,
  });
}
