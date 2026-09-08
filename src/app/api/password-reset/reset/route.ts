import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { token, newPassword } = await req.json();

  if (!token || !newPassword) {
    return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Verify token
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }

  const encodedPayload = token.slice(0, dotIndex);
  const providedSig = token.slice(dotIndex + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString();
  } catch {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }

  const expectedSig = createHmac("sha256", process.env.OTP_SECRET!)
    .update(payload)
    .digest("hex");

  if (providedSig !== expectedSig) {
    await supabaseAdmin.from("system_logs").insert({
      level: "WARN",
      message: "Password reset failed: invalid token signature",
      metadata: { reason: "invalid_token" },
    });
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }

  const [email, expiryStr] = payload.split(":");
  if (!email || !expiryStr || Date.now() > Number(expiryStr)) {
    await supabaseAdmin.from("system_logs").insert({
      level: "WARN",
      message: "Password reset failed: expired token",
      metadata: { email: email ?? null, reason: "expired_token" },
    });
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  // Find user and update password
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const user = authUsers?.users.find(u => u.email === email);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    await supabaseAdmin.from("system_logs").insert({
      level: "ERROR",
      message: "Password reset failed: Supabase error",
      metadata: { email, userId: user.id, reason: error.message },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clear the temporary password flag - covers users who missed their welcome email
  await supabaseAdmin
    .from("investors")
    .update({ requires_password_change: false })
    .eq("user_id", user.id);

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Password reset completed",
    metadata: { email, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
