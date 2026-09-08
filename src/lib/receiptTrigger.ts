// Fires the transaction-receipt Google Apps Script Web App (paymentcode.gs) for one investor.
// The script finds that investor's investor_transactions rows with receipt_url IS NULL,
// generates the PDF from the receipt template, saves it to Drive, PATCHes receipt_url back
// to Supabase, and emails the investor — same as running generateForOne() manually.
// Set RECEIPT_APPS_SCRIPT_URL + RECEIPT_WEBAPP_SECRET in .env.local (must match WEBAPP_SECRET in paymentcode.gs).

type TriggerResult = { ok: true } | { ok: false; error: string };

export async function triggerReceiptForInvestor(investorName: string): Promise<TriggerResult> {
  const url = process.env.RECEIPT_APPS_SCRIPT_URL;
  const secret = process.env.RECEIPT_WEBAPP_SECRET;
  if (!url || !secret) {
    console.warn("[receiptTrigger] RECEIPT_APPS_SCRIPT_URL or RECEIPT_WEBAPP_SECRET not set - skipping receipt generation");
    return { ok: false, error: "Receipt Apps Script not configured" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generateForOne", secret, name: investorName }),
      redirect: "follow",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      return { ok: false, error: data?.error ?? "Apps Script returned non-ok" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}
