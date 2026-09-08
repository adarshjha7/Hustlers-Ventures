import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email, name } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  const payload = `${email}:${otp}:${expiry}`;
  const sig = createHmac("sha256", process.env.OTP_SECRET!)
    .update(payload)
    .digest("hex");
  const token = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  try {
    await sendOtpEmail({ toEmail: email, toName: name || "there", otpCode: otp });
  } catch (err) {
    console.error("OTP email failed:", err);
    return NextResponse.json({ error: "Failed to send verification email." }, { status: 500 });
  }

  return NextResponse.json({ token });
}
