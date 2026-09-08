import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JSZip from "jszip";

// GET — bundle the current investor's payout receipts into a single ZIP.
// receipt_url values are a mix of Google Drive share links ("/file/d/<id>/view"),
// occasional direct http(s) files, Supabase Storage paths, and stray junk values —
// each is resolved server-side (no browser CORS issue here) and skipped on failure
// rather than failing the whole request.
//
// Optional ?investmentId=<id> restricts the zip to one investment's receipts
// (used by the per-asset Payout History card); omitted, it bundles every receipt
// across every investor profile linked to this login (used by the Documents Vault).

function getDriveAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

function extractDriveFileId(url: string): string | null {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]{10,})/, /[?&]id=([a-zA-Z0-9_-]{10,})/];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A login can map to more than one investor profile (e.g. a shared family/associate login).
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", user.id);
  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor profile not found." }, { status: 404 });
  const investorIds = investors.map(i => i.investor_id);

  const investmentIdFilter = new URL(req.url).searchParams.get("investmentId");

  let investmentQuery = supabaseAdmin
    .from("investor_investments")
    .select("investment_id, company_name, company_pools(pool_name)")
    .in("investor_id", investorIds);
  if (investmentIdFilter) investmentQuery = investmentQuery.eq("investment_id", investmentIdFilter);
  const { data: investments } = await investmentQuery;
  if (!investments || investments.length === 0) return NextResponse.json({ error: "No investments found." }, { status: 404 });

  const investmentIds = investments.map(i => i.investment_id);
  const assetNameByInvestment: Record<string, string> = {};
  investments.forEach((inv: any) => {
    const poolData = Array.isArray(inv.company_pools) ? inv.company_pools[0] : inv.company_pools;
    assetNameByInvestment[inv.investment_id] = inv.company_name || poolData?.pool_name || "Asset";
  });

  const { data: payments, error: paymentsError } = await supabaseAdmin
    .from("investor_quarterly_payments")
    .select("payment_id, receipt_url, payment_date, investment_id, quarterly_roi_declarations(quarter_year, month_names)")
    .in("investment_id", investmentIds)
    .not("receipt_url", "is", null);
  if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 });
  if (!payments || payments.length === 0) return NextResponse.json({ error: "No receipts found." }, { status: 404 });

  const driveAuth = getDriveAuthClient();
  const drive = driveAuth ? google.drive({ version: "v3", auth: driveAuth }) : null;

  const zip = new JSZip();
  const usedNames = new Set<string>();
  let successCount = 0;
  const failures: string[] = [];

  for (const pay of payments as any[]) {
    const url: string = pay.receipt_url;
    const decl = Array.isArray(pay.quarterly_roi_declarations) ? pay.quarterly_roi_declarations[0] : pay.quarterly_roi_declarations;
    const quarter = decl?.quarter_year || "Distribution";
    const assetName = assetNameByInvestment[pay.investment_id] || "Asset";
    const label = `${quarter} - ${assetName} - ${pay.payment_date || pay.payment_id}`;

    try {
      let buffer: Buffer;
      let ext = "pdf";

      const driveFileId = extractDriveFileId(url);
      if (driveFileId) {
        if (!drive) throw new Error("Drive API not configured");
        const meta = await drive.files.get({ fileId: driveFileId, fields: "name,mimeType" });
        const driveName = meta.data.name || label;
        ext = driveName.includes(".") ? driveName.split(".").pop()! : (meta.data.mimeType?.includes("pdf") ? "pdf" : "bin");
        const res = await drive.files.get({ fileId: driveFileId, alt: "media" }, { responseType: "arraybuffer" });
        buffer = Buffer.from(res.data as ArrayBuffer);
      } else if (url.startsWith("http")) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        const urlExt = url.split(".").pop()?.split("?")[0];
        if (urlExt && urlExt.length <= 5) ext = urlExt;
      } else {
        // Fall back to treating it as a Supabase Storage path in the 'receipts' bucket.
        const { data, error } = await supabaseAdmin.storage.from("receipts").download(url);
        if (error || !data) throw error || new Error("Not found in storage");
        buffer = Buffer.from(await data.arrayBuffer());
      }

      const safeName = sanitizeFileName(label);
      let fileName = `${safeName}.${ext}`;
      let counter = 1;
      while (usedNames.has(fileName)) fileName = `${safeName} (${counter++}).${ext}`;
      usedNames.add(fileName);

      zip.file(fileName, buffer);
      successCount++;
    } catch (err: any) {
      failures.push(label);
      console.error(`Failed to fetch receipt for ${label}:`, err?.message || err);
    }
  }

  if (successCount === 0) {
    return NextResponse.json({ error: "Could not fetch any receipts.", failures }, { status: 502 });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: "Investor downloaded payout receipts as ZIP",
    metadata: { userId: user.id, investmentIdFilter, successCount, failedCount: failures.length },
  });

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Payout-Receipts-${new Date().toISOString().slice(0, 10)}.zip"`,
      "X-Receipt-Success-Count": String(successCount),
      "X-Receipt-Failed-Count": String(failures.length),
    },
  });
}
