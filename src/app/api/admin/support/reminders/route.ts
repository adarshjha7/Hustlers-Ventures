import { NextResponse } from "next/server";
import crypto from "crypto";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSupportTicketRaisedEmail } from "@/lib/mailer";

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Resends the "new ticket" notification email for any open/in-progress thread whose most
 * recent message is from the investor and has gone unanswered by admin for over an hour.
 * Triggered hourly by Supabase pg_cron + pg_net (see support_reminders_cron_migration.sql) —
 * Vercel's Hobby plan only allows daily cron, so the schedule lives in Supabase instead and
 * just calls this route over HTTPS. Same email content/recipients as the initial ticket-raised
 * notification, just repeated until admin replies.
 *
 * Auth paths (either is enough): bearer token (Authorization: Bearer <CRON_SECRET>, sent by the
 * pg_cron job), or a logged-in admin session (manual trigger).
 */
async function handle(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";
  let authorized =
    !!cronSecret && expected.length === authHeader.length && timingSafeEqual(authHeader, expected);

  if (!authorized) {
    const admin = await guardAdmin();
    if (admin) authorized = true;
  }
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: threads, error } = await supabaseAdmin
    .from("support_threads")
    .select("id, ticket_ref, subject, investor_id, last_reminder_sent_at")
    .in("status", ["OPEN", "IN_PROGRESS"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const threadIds = (threads ?? []).map(t => t.id);
  if (threadIds.length === 0) return NextResponse.json({ ok: true, sent: 0, skipped: 0 });

  const { data: messages } = await supabaseAdmin
    .from("support_messages")
    .select("thread_id, sender_role, content, created_at")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  const lastMessageByThread: Record<string, { sender_role: string; content: string | null; created_at: string }> = {};
  (messages ?? []).forEach((m: { thread_id: string; sender_role: string; content: string | null; created_at: string }) => {
    lastMessageByThread[m.thread_id] = m;
  });

  const now = Date.now();
  const candidates = (threads ?? []).filter(t => {
    const last = lastMessageByThread[t.id];
    if (!last || last.sender_role !== "INVESTOR") return false;
    if (now - new Date(last.created_at).getTime() < ONE_HOUR_MS) return false;
    if (t.last_reminder_sent_at && now - new Date(t.last_reminder_sent_at).getTime() < ONE_HOUR_MS) return false;
    return true;
  });

  if (candidates.length === 0) return NextResponse.json({ ok: true, sent: 0, skipped: (threads ?? []).length });

  const investorIds = Array.from(new Set(candidates.map(t => t.investor_id)));
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id, investor_name")
    .in("investor_id", investorIds);
  const investorNameById: Record<string, string> = {};
  (investors ?? []).forEach((i: { investor_id: string; investor_name: string }) => { investorNameById[i.investor_id] = i.investor_name; });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const t of candidates) {
    const last = lastMessageByThread[t.id];
    try {
      await sendSupportTicketRaisedEmail({
        investorName: investorNameById[t.investor_id] ?? "Investor",
        ticketRef: t.ticket_ref,
        subject: t.subject,
        message: last.content ?? "(sent an attachment)",
        threadId: t.id,
      });
      await supabaseAdmin
        .from("support_threads")
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq("id", t.id);
      sent++;
    } catch (err) {
      failed++;
      errors.push(`${t.ticket_ref}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "support_reminder_emails_sent",
    metadata: { sent, failed, errors },
  });

  return NextResponse.json({ ok: true, sent, failed, errors });
}

export async function POST(req: Request) {
  return handle(req);
}

// Vercel Cron uses GET by default.
export async function GET(req: Request) {
  return handle(req);
}
