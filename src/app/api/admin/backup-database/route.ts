import { NextResponse } from "next/server";
import crypto from "crypto";
import { Readable } from "stream";
import JSZip from "jszip";
import { google } from "googleapis";
import { createClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Money-critical tables only - the ones where losing data would actually hurt investors.
// Logs, marketing/opportunity content etc. are deliberately excluded; Supabase's own
// backups already cover the full DB, this is a lightweight extra copy of just the tables
// that represent real capital, stored somewhere outside Supabase entirely.
const BACKUP_TABLES = [
  "investors",
  "investor_investments",
  "investor_transactions",
  "investor_quarterly_payments",
  "loans",
  "loan_emi_payments",
] as const;

// Must be a Shared Drive (or a folder inside one) - service accounts have no storage
// quota of their own, so uploads into a regular "My Drive" folder fail with
// storageQuotaExceeded even when shared as Editor. A Shared Drive's storage belongs to
// the drive itself, not the service account, which is what makes this work.
const DRIVE_FOLDER_ID = "0AGgMz6_lgfpqUk9PVA";
const PAGE_SIZE = 1000; // Supabase's default row cap per request - paginate past it.

async function fetchAllRows(table: string): Promise<any[]> {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

// auth.users isn't a queryable table (no .from() access) - it's only reachable via the
// admin API, and separately paginated (page/perPage, not range).
async function fetchAuthUsersRows(): Promise<{ user_id: string; email: string | null }[]> {
  const rows: { user_id: string; email: string | null }[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth.users: ${error.message}`);
    const users = data?.users ?? [];
    rows.push(...users.map(u => ({ user_id: u.id, email: u.email ?? null })));
    if (users.length < perPage) break;
    page++;
  }
  return rows;
}

// Flattens an array of flat row objects into CSV text. Object/array cell values (e.g. a
// jsonb column) are stringified rather than expanded into columns - good enough for a
// backup meant to be restorable/inspectable, not a full relational CSV export.
function toCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map(h => escape(row[h])).join(","));
  return lines.join("\n");
}

function getDriveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    // drive.file (not drive.readonly) - needed to create the backup zip. Only grants
    // access to files this service account creates itself, not the rest of the Drive.
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  return google.drive({ version: "v3", auth });
}

/**
 * Weekly snapshot of the money-critical tables (investors, investments, transactions,
 * payouts, loans, EMIs) plus the auth users table (user_id + email), as a zipped CSV
 * bundle uploaded to Drive.
 *
 * Auth paths (either is enough):
 *   - Logged-in admin (browser -> "Run Backup Now" button on /admin/backups)
 *   - Cron (Vercel Cron -> Authorization: Bearer <CRON_SECRET>, see vercel.json)
 */
async function handle(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";
  let authorized =
    !!cronSecret && expected.length === authHeader.length && timingSafeEqual(authHeader, expected);

  if (!authorized) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && isAdmin(user.email)) authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const counts: Record<string, number> = {};

  try {
    const zip = new JSZip();
    for (const table of BACKUP_TABLES) {
      const rows = await fetchAllRows(table);
      counts[table] = rows.length;
      zip.file(`${table}.csv`, toCsv(rows));
    }

    const authRows = await fetchAuthUsersRows();
    counts["users"] = authRows.length;
    zip.file("users.csv", toCsv(authRows));

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const fileName = `backup-${dateStr}.zip`;

    const drive = getDriveClient();
    const uploadRes = await drive.files.create({
      requestBody: { name: fileName, parents: [DRIVE_FOLDER_ID] },
      media: { mimeType: "application/zip", body: Readable.from(zipBuffer) },
      fields: "id, webViewLink",
      supportsAllDrives: true, // required for Shared Drives - omitted, the API 404s the parent
    });

    await supabaseAdmin.from("system_logs").insert({
      level: "INFO",
      message: "Weekly database backup completed",
      metadata: {
        fileName,
        driveFileId: uploadRes.data.id,
        driveLink: uploadRes.data.webViewLink,
        counts,
        sizeBytes: zipBuffer.length,
      },
    }).then(null, console.error);

    return NextResponse.json({
      ok: true,
      fileName,
      counts,
      driveFileId: uploadRes.data.id,
      webViewLink: uploadRes.data.webViewLink,
    });
  } catch (err: any) {
    console.error("[backup-database] failed:", err);
    await supabaseAdmin.from("system_logs").insert({
      level: "ERROR",
      message: "Weekly database backup failed",
      metadata: { error: err?.message ?? "Unknown error", counts },
    }).then(null, console.error);
    return NextResponse.json({ error: err?.message ?? "Backup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handle(req);
}

// Vercel Cron uses GET by default.
export async function GET(req: Request) {
  return handle(req);
}
