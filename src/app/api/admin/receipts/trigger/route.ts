import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { triggerReceiptForInvestor } from "@/lib/receiptTrigger";

// POST { investorName } - runs generateForOne() in paymentcode.gs for this investor,
// generating + emailing receipts for all of their pending (receipt_url IS NULL) transactions.
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investorName } = await req.json();
  if (!investorName || !String(investorName).trim()) {
    return NextResponse.json({ error: "investorName is required." }, { status: 400 });
  }

  const result = await triggerReceiptForInvestor(String(investorName).trim());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  return NextResponse.json({ success: true });
}
