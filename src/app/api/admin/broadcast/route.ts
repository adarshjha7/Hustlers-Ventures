import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";
import { sendBroadcastMessage } from "@/lib/whatsappStub";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

function buildEmailHtml(subject: string, body: string, imageUrls: string[], videoUrl?: string | null, pdfUrl?: string | null, pixelUrl?: string): string {
  const bodyHtml = body
    .split("\n\n")
    .map(para => `<p style="margin:0 0 16px;color:#374151;line-height:1.7">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const imagesHtml = imageUrls.length > 0
    ? imageUrls.map(url => `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;display:block" />`).join("")
    : "";

  // Most email clients (Gmail, Outlook, Apple Mail) strip <video> tags outright,
  // so we link out to the hosted file with a styled CTA instead of embedding it.
  const videoHtml = videoUrl
    ? `<a href="${videoUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;margin-right:12px;padding:14px 22px;background:#0B1120;color:#05CE78;font-weight:800;font-size:14px;text-decoration:none;border-radius:12px">▶ Watch Video</a>`
    : "";

  const pdfHtml = pdfUrl
    ? `<a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:14px 22px;background:#ffffff;color:#0B1120;font-weight:800;font-size:14px;text-decoration:none;border-radius:12px;border:2px solid #0B1120">📄 View Document</a>`
    : "";

  const pixelHtml = pixelUrl
    ? `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0B1120;padding:28px 32px">
      <span style="font-size:13px;font-weight:800;letter-spacing:2px;color:#05CE78;text-transform:uppercase">Hustlers Ventures</span>
    </div>
    <div style="padding:36px 32px">
      <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#0B1120;line-height:1.3">${subject}</h2>
      ${bodyHtml}
      ${imagesHtml ? `<div style="margin-top:24px">${imagesHtml}</div>` : ""}
      ${videoHtml}${pdfHtml}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:#9ca3af">© Hustlers Ventures · You're receiving this because you're a registered investor.</p>
      ${pixelHtml}
    </div>
  </div>
</body></html>`;
}

interface Recipient { name: string; email: string | null; phone?: string | null; investor_id?: string; }

async function getRecipients(filter: { type: string; value?: string }): Promise<Recipient[]> {

  // Manual contacts — email|phone format (phone optional)
  if (filter.type === "manual" && filter.value) {
    return filter.value
      .split(",")
      .map(entry => {
        const [email, phone] = entry.trim().split("|");
        return { name: email.split("@")[0], email: email.trim().toLowerCase(), phone: phone?.trim() || null };
      })
      .filter(c => c.email.includes("@"));
  }

  // Select specific investors by ID
  if (filter.type === "select" && filter.value) {
    const ids = filter.value.split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return [];
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map(users.map((u: any) => [u.id, u.email as string]));
    const { data: investors } = await supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, user_id, phone")
      .in("investor_id", ids);
    // Keep anyone reachable by at least one channel — email OR phone.
    // Investors who never completed signup (no user_id yet) still have a
    // phone on file and are valid WhatsApp-only recipients.
    return (investors ?? [])
      .map((i: any) => ({ investor_id: i.investor_id, name: i.investor_name ?? "Investor", email: i.user_id ? (emailMap.get(i.user_id) ?? null) : null, phone: i.phone ?? null }))
      .filter((i: any) => !!i.email || !!i.phone) as Recipient[];
  }

  // Fetch all auth users once
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(users.map((u: any) => [u.id, u.email as string]));

  // Not filtering out user_id IS NULL here — investors without an auth
  // account yet (pending signup) can still be reached via WhatsApp using
  // the phone number on their investors row.
  let investorQuery = supabaseAdmin
    .from("investors")
    .select("investor_id, investor_name, user_id, phone");

  if (filter.type === "pool" && filter.value) {
    // Fix: use purchase_id (the real FK column), not pool_id
    const { data: investments } = await supabaseAdmin
      .from("investor_investments")
      .select("investor_id")
      .eq("purchase_id", filter.value)
      .gt("total_amount", 0);
    const ids = [...new Set((investments ?? []).map((i: any) => i.investor_id))];
    if (ids.length === 0) return [];
    investorQuery = investorQuery.in("investor_id", ids);

  } else if (filter.type === "active") {
    const { data: investments } = await supabaseAdmin
      .from("investor_investments")
      .select("investor_id")
      .gt("total_amount", 0);
    const ids = [...new Set((investments ?? []).map((i: any) => i.investor_id))];
    if (ids.length === 0) return [];
    investorQuery = investorQuery.in("investor_id", ids);

  } else if (filter.type === "exited") {
    const { data: investments } = await supabaseAdmin
      .from("investor_investments")
      .select("investor_id")
      .eq("total_amount", 0);
    const ids = [...new Set((investments ?? []).map((i: any) => i.investor_id))];
    if (ids.length === 0) return [];
    investorQuery = investorQuery.in("investor_id", ids);
  }
  // "all" falls through with no extra filter

  const { data: investors } = await investorQuery;

  return (investors ?? [])
    .map((i: any) => ({
      investor_id: i.investor_id,
      name: i.investor_name ?? "Investor",
      email: i.user_id ? (emailMap.get(i.user_id) ?? null) : null,
      phone: i.phone ?? null,
    }))
    .filter((i: any) => !!i.email || !!i.phone) as Recipient[];
}

export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const value = searchParams.get("value") ?? undefined;

  const recipients = await getRecipients({ type, value });
  return NextResponse.json({
    count: recipients.length,
    emails: recipients.map(r => ({ name: r.name, email: r.email, phone: r.phone ?? null })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    subject, body: bodyText, image_urls = [], video_url = null, pdf_url = null,
    filter = { type: "all" },
    channels = ["email"],   // ["email"] | ["whatsapp"] | ["email","whatsapp"]
    preview = false,
  } = body;

  const sendEmail = channels.includes("email");
  const sendWA = channels.includes("whatsapp");

  if (sendEmail && !subject?.trim()) return NextResponse.json({ error: "Subject is required for email." }, { status: 400 });
  if (!bodyText?.trim()) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const recipients = await getRecipients(filter);
  if (recipients.length === 0) return NextResponse.json({ error: "No recipients found for the selected filter." }, { status: 400 });

  if (preview) {
    // No log row exists yet to back a short link, so preview shows the raw URL.
    return NextResponse.json({ html: buildEmailHtml(subject ?? "", bodyText, image_urls, video_url, pdf_url), recipient_count: recipients.length });
  }

  // Pre-generate UUID so pixel ref is known before inserting the log row
  const broadcastLogId = crypto.randomUUID();

  // Branded short links (hustlersventures.co/v/AbC123) instead of the raw,
  // long Supabase Storage URLs — resolved by src/app/v/[code]/route.ts.
  const videoShortCode = video_url ? crypto.randomBytes(6).toString("base64url") : null;
  const shortVideoUrl = videoShortCode ? `${SITE_URL}/v/${videoShortCode}` : null;
  const pdfShortCode = pdf_url ? crypto.randomBytes(6).toString("base64url") : null;
  const shortPdfUrl = pdfShortCode ? `${SITE_URL}/v/${pdfShortCode}` : null;

  // WhatsApp templates can't embed a media player, and template parameters
  // can't contain real newlines (sendBroadcastMessage strips them anyway —
  // Meta rejects params with \n/\t/4+ spaces), so a line break before the
  // link isn't achievable here. Use bold + a bullet separator instead so
  // it still reads as a distinct, clearly-labeled section on one line.
  let waMessage = bodyText;
  if (shortVideoUrl) waMessage += ` • 🎥 *Watch Video*: ${shortVideoUrl}`;
  if (shortPdfUrl) waMessage += ` • 📄 *View Document*: ${shortPdfUrl}`;
  const results: { name: string; email: string | null; email_status?: string; wa_status?: string; error?: string }[] = [];
  let emailSent = 0, emailFailed = 0, waSent = 0, waFailed = 0, waSkipped = 0;

  for (const inv of recipients) {
    const row: (typeof results)[0] = { name: inv.name, email: inv.email ?? null };

    // Email — per-recipient HTML so pixel uid identifies the opener.
    // Recipients can now be phone-only (no auth account yet), so guard
    // against a missing email instead of assuming every recipient has one.
    if (sendEmail) {
      if (!inv.email) {
        row.email_status = "skipped (no email)";
      } else {
        const uid = Buffer.from(inv.email).toString("base64url");
        const pixelUrl = `${SITE_URL}/api/track/open?type=broadcast&ref=${broadcastLogId}&uid=${uid}`;
        const html = buildEmailHtml(subject ?? "", bodyText, image_urls, shortVideoUrl, shortPdfUrl, pixelUrl);
        try {
          await transporter.sendMail({
            from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
            to: inv.email,
            subject: subject ?? "",
            html,
            text: bodyText,
          });
          row.email_status = "sent";
          emailSent++;
        } catch (err: any) {
          row.email_status = "failed";
          row.error = err.message;
          emailFailed++;
        }
      }
    }

    // WhatsApp
    if (sendWA) {
      if (!inv.phone) {
        row.wa_status = "skipped (no phone)";
        waSkipped++;
      } else {
        const waResult = await sendBroadcastMessage({ toPhone: inv.phone, name: inv.name, message: waMessage });
        if (waResult.ok) { row.wa_status = "sent"; waSent++; }
        else { row.wa_status = `failed: ${waResult.error}`; waFailed++; }
      }
    }

    results.push(row);
    await new Promise(r => setTimeout(r, 120));
  }

  await supabaseAdmin.from("broadcast_logs").insert({
    id: broadcastLogId,
    subject: subject ?? null,
    body: bodyText,
    image_urls: image_urls.length > 0 ? image_urls : null,
    video_url: video_url || null,
    video_short_code: videoShortCode,
    pdf_url: pdf_url || null,
    pdf_short_code: pdfShortCode,
    recipient_filter: filter,
    recipient_count: recipients.length,
    sent_count: emailSent + waSent,
    failed_count: emailFailed + waFailed,
    results,
    created_by: admin.email,
  });

  return NextResponse.json({
    ok: true,
    total: recipients.length,
    email: sendEmail ? { sent: emailSent, failed: emailFailed } : null,
    whatsapp: sendWA ? { sent: waSent, failed: waFailed, skipped: waSkipped } : null,
  });
}
