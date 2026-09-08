import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  // Check user exists - but always return success to avoid email enumeration
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = authUsers?.users.find(u => u.email === email);

  if (user) {
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    const payload = `${email}:${expiry}`;
    const sig = createHmac("sha256", process.env.OTP_SECRET!)
      .update(payload)
      .digest("hex");
    const token = `${Buffer.from(payload).toString("base64url")}.${sig}`;
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail({ toEmail: email, resetUrl });
    } catch (err) {
      console.error("Password reset email failed:", err);
    }
  }

  // Log the request regardless of whether email exists (no enumeration leak)
  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Password reset requested",
    metadata: { email, userId: user?.id ?? null },
  });

  // Always respond with success - don't reveal whether the email exists
  return NextResponse.json({ success: true });
}
