import { NextResponse } from "next/server";
import { sendAdminEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { fromName, fromEmail, phone, subject, message } = await req.json();

  if (!fromName || !fromEmail || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await sendAdminEmail({
      fromName,
      fromEmail,
      phone: phone || undefined,
      subject: subject || "New Lead - Hustlers Ventures",
      message,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead notification email failed:", err);
    return NextResponse.json({ error: "Failed to send notification." }, { status: 500 });
  }
}
