// Loan EMI reminders disabled — re-enable when loans feature is active
export async function GET() {
  return Response.json({ disabled: true }, { status: 200 });
}

/*
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { transporter } from "@/lib/mailer";
import { sendLoanEmiReminder } from "@/lib/whatsappStub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().slice(0, 10);

  // Mark overdue: pending EMIs whose due_date is before today
  await supabaseAdmin
    .from("loan_emi_payments")
    .update({ status: "overdue" })
    .eq("status", "pending")
    .lt("due_date", todayStr);

  // Fetch overdue EMIs
  const { data: overdueEmis } = await supabaseAdmin
    .from("loan_emi_payments")
    .select("emi_id, emi_number, due_date, emi_amount, loan_id, loans(borrower_name, loan_type, contact_phone)")
    .eq("status", "overdue")
    .order("due_date");

  // Fetch upcoming EMIs (due today through next 7 days)
  const { data: upcomingEmis } = await supabaseAdmin
    .from("loan_emi_payments")
    .select("emi_id, emi_number, due_date, emi_amount, loan_id, loans(borrower_name, loan_type, contact_phone)")
    .eq("status", "pending")
    .gte("due_date", todayStr)
    .lte("due_date", in7DaysStr)
    .order("due_date");

  const hasOverdue = (overdueEmis?.length ?? 0) > 0;
  const hasUpcoming = (upcomingEmis?.length ?? 0) > 0;

  if (!hasOverdue && !hasUpcoming) {
    return NextResponse.json({ message: "No EMIs due — no email sent." });
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatAmount = (n: number) =>
    `₹${Number(n).toLocaleString("en-IN")}`;

  const rowStyle = "border-bottom:1px solid #e5e7eb;";
  const tdBase = "padding:10px 12px;font-size:14px;";

  const buildRows = (emis: typeof overdueEmis, isOverdue: boolean) =>
    (emis ?? []).map((e: any) => `
      <tr style="${rowStyle}">
        <td style="${tdBase}color:#0b1120;font-weight:600">${e.loans?.borrower_name ?? "—"}</td>
        <td style="${tdBase}color:#6b7280">${e.loans?.loan_type ?? "—"}</td>
        <td style="${tdBase}color:#6b7280">EMI #${e.emi_number}</td>
        <td style="${tdBase}color:#6b7280">${formatDate(e.due_date)}</td>
        <td style="${tdBase}font-weight:700;color:${isOverdue ? "#dc2626" : "#0b1120"}">${formatAmount(e.emi_amount)}</td>
      </tr>`
    ).join("");

  const tableHeader = `
    <tr style="background:#f9fafb;">
      <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left">Borrower</th>
      <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left">Type</th>
      <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left">EMI</th>
      <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left">Due Date</th>
      <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left">Amount</th>
    </tr>`;

  const overdueSection = hasOverdue ? `
    <h2 style="font-size:16px;font-weight:800;color:#dc2626;margin:28px 0 12px">
      ⚠️ Overdue Payments (${overdueEmis!.length})
    </h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <thead>${tableHeader}</thead>
      <tbody>${buildRows(overdueEmis, true)}</tbody>
    </table>` : "";

  const upcomingSection = hasUpcoming ? `
    <h2 style="font-size:16px;font-weight:800;color:#0b1120;margin:28px 0 12px">
      📅 Due in Next 7 Days (${upcomingEmis!.length})
    </h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <thead>${tableHeader}</thead>
      <tbody>${buildRows(upcomingEmis, false)}</tbody>
    </table>` : "";

  const adminPortalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/loans`;

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;padding:32px 24px;background:#ffffff">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:24px">
        Hustlers Ventures · Loan EMI Reminder
      </p>
      <h1 style="font-size:22px;font-weight:800;color:#0b1120;margin-bottom:8px">Loan EMI Digest</h1>
      <p style="font-size:14px;color:#6b7280;margin-bottom:24px">${formatDate(todayStr)}</p>

      ${overdueSection}
      ${upcomingSection}

      <div style="margin-top:32px;text-align:center">
        <a href="${adminPortalUrl}"
           style="display:inline-block;background:#05CE78;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
          View Loans in Admin
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center">
        This is an automated daily digest from Hustlers Ventures.
      </p>
    </div>`;

  const subject = [
    hasOverdue && `${overdueEmis!.length} overdue`,
    hasUpcoming && `${upcomingEmis!.length} due soon`,
  ].filter(Boolean).join(", ");

  const to = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.GMAIL_USER!;
  await transporter.sendMail({
    from: `"Hustlers Ventures" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[Loan EMI] ${subject}`,
    html,
  });

  // Send WhatsApp reminders for upcoming EMIs that have a contact_phone
  const waTargets = [...(upcomingEmis ?? [])].filter((e: any) => e.loans?.contact_phone);
  const waResults = await Promise.allSettled(
    waTargets.map((e: any) =>
      sendLoanEmiReminder({
        toPhone: e.loans.contact_phone,
        borrowerName: e.loans.borrower_name,
        emiNumber: e.emi_number,
        emiAmount: formatAmount(e.emi_amount),
        dueDate: formatDate(e.due_date),
        loanType: e.loans.loan_type,
      })
    )
  );
  const waOk = waResults.filter((r) => r.status === "fulfilled" && (r.value as any).ok).length;

  // Log to system_logs
  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Loan EMI reminder sent",
    metadata: {
      overdue: overdueEmis?.length ?? 0,
      upcoming: upcomingEmis?.length ?? 0,
      whatsapp_sent: waOk,
      date: todayStr,
    },
  });

  return NextResponse.json({
    sent: true,
    overdue: overdueEmis?.length ?? 0,
    upcoming: upcomingEmis?.length ?? 0,
    whatsapp_sent: waOk,
  });
}
*/
