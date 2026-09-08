import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 1×1 transparent GIF (44 bytes)
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email_type = searchParams.get("type") ?? "unknown";
  const ref_id     = searchParams.get("ref") ?? null;
  const uid        = searchParams.get("uid") ?? null;
  const user_agent = req.headers.get("user-agent") ?? null;

  // Fire-and-forget — don't block the pixel response
  supabaseAdmin.from("email_events").insert({ email_type, ref_id, uid, user_agent }).then(
    null,
    (e) => console.error("[track/open]", e)
  );

  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
