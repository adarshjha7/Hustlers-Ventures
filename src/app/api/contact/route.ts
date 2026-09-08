import { NextResponse } from "next/server";
import { sendAdminEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { name, email, phone, subject, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  try {
    await sendAdminEmail({
      fromName: name,
      fromEmail: email,
      phone: phone || undefined,
      subject: subject || "Contact Form - Hustlers Ventures",
      message,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email failed:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
