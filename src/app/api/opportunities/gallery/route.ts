import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const IMAGE_MIMES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
]);

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

function extractFolderId(input: string): string {
  // Accept either a bare ID or a full Drive URL
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.split("?")[0].trim();
}

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("folderId");
  if (!raw) return NextResponse.json({ error: "folderId required" }, { status: 400 });
  const folderId = extractFolderId(raw);

  try {
    const auth = getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType)",
      pageSize: 50,
      orderBy: "name",
    });

    const images = (res.data.files ?? [])
      .filter(f => IMAGE_MIMES.has(f.mimeType ?? ""))
      .map(f => ({
        id: f.id,
        name: f.name,
        src: `https://lh3.googleusercontent.com/d/${f.id}`,
        thumbnail: `https://lh3.googleusercontent.com/d/${f.id}=s800`,
      }));

    return NextResponse.json({ images }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Drive API error" }, { status: 500 });
  }
}
