import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPasswordResetEmail } from "@/lib/mailer";

async function sendReminder(email: string): Promise<boolean> {
  try {
    const expiry = Date.now() + 60 * 60 * 1000;
    const payload = `${email}:${expiry}`;
    const sig = createHmac("sha256", process.env.OTP_SECRET!).update(payload).digest("hex");
    const token = `${Buffer.from(payload).toString("base64url")}.${sig}`;
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ toEmail: email, resetUrl });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { email?: string };

  if (body.email) {
    const ok = await sendReminder(body.email);
    return NextResponse.json({ sent: ok ? 1 : 0, failed: ok ? 0 : 1 });
  }

  // Bulk: all active investors who haven't completed setup. Excludes pending (no-login)
  // investors — they have no email yet and get an onboarding invite, not a password reminder.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("user_id")
    .eq("requires_password_change", true)
    .eq("is_active", true)
    .not("user_id", "is", null);

  if (!investors?.length) return NextResponse.json({ sent: 0, failed: 0 });

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  authUsers?.users.forEach(u => { emailMap[u.id] = u.email ?? ""; });

  let sent = 0, failed = 0;
  for (const inv of investors) {
    const email = emailMap[inv.user_id];
    if (!email) { failed++; continue; }
    const ok = await sendReminder(email);
    if (ok) sent++; else failed++;
  }

  return NextResponse.json({ sent, failed });
}
