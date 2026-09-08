import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { sendProfileReminder } from "@/lib/whatsappStub";

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Sends a WhatsApp reminder to every onboarded investor whose profile is missing
 * any of: bank_account_no, pan_number, bank_ifsc.
 *
 * Auth paths (either is enough):
 *   - Logged-in admin (browser → "Send profile reminders" button)
 *   - Cron (Vercel Cron → Authorization: Bearer <CRON_SECRET>)
 *
 * To avoid spam, an investor reminded in the last 24h is skipped (cron may run hourly).
 */
async function handle(req: Request) {
  // Auth: cron secret OR admin session
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";
  let authorized =
    !!cronSecret && expected.length === authHeader.length && timingSafeEqual(authHeader, expected);

  if (!authorized) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && isAdmin(user.email)) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find onboarded investors with at least one missing field.
  const { data: investors, error } = await admin
    .from("investors")
    .select(
      "investor_id, investor_name, phone, bank_account_no, pan_number, bank_ifsc, profile_reminder_sent_at"
    )
    .not("user_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const inv of investors ?? []) {
    const missing: string[] = [];
    if (!inv.bank_account_no) missing.push("Bank Account");
    if (!inv.pan_number) missing.push("PAN");
    if (!inv.bank_ifsc) missing.push("IFSC");
    if (missing.length === 0) continue; // profile complete

    if (!inv.phone) {
      skipped++;
      continue;
    }

    // Dedup: skip if reminded within the last 24h.
    if (
      inv.profile_reminder_sent_at &&
      new Date(inv.profile_reminder_sent_at).getTime() > oneDayAgo
    ) {
      skipped++;
      continue;
    }

    const result = await sendProfileReminder({
      toPhone: inv.phone,
      name: inv.investor_name ?? "Investor",
      loginUrl,
      missing,
    });

    if (result.ok) {
      sent++;
      await admin
        .from("investors")
        .update({ profile_reminder_sent_at: new Date().toISOString() })
        .eq("investor_id", inv.investor_id);
    } else {
      failed++;
      errors.push(`${inv.investor_id}: ${result.error}`);
    }
  }

  console.log(
    `[profile-reminders] total=${investors?.length ?? 0} sent=${sent} skipped=${skipped} failed=${failed}`
  );

  return NextResponse.json({ ok: true, sent, skipped, failed, errors });
}

export async function POST(req: Request) {
  return handle(req);
}

// Vercel Cron uses GET by default.
export async function GET(req: Request) {
  return handle(req);
}
