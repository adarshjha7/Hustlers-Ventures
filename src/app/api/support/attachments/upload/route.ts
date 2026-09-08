import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAllowedAttachmentType, fileCategoryForMimeType, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/supportUtils";

// POST — upload a support attachment. If threadId is provided, the investor must own that thread;
// threadId may be omitted when attaching to a brand-new (not-yet-created) request.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A login can map to more than one investor profile (e.g. a shared family/associate
  // login) — fetch all matches rather than .maybeSingle(), which errors on >1 row.
  const { data: investors } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", user.id);
  if (!investors || investors.length === 0) return NextResponse.json({ error: "Investor profile not found." }, { status: 404 });
  const investorIds = investors.map(i => i.investor_id);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const threadId = formData.get("threadId") as string | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (threadId) {
    const { data: thread } = await supabaseAdmin
      .from("support_threads")
      .select("id")
      .eq("id", threadId)
      .in("investor_id", investorIds)
      .maybeSingle();
    if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  if (!isAllowedAttachmentType(file.type)) {
    return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `support/${threadId ?? "new"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("support-attachments")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    path,
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    fileCategory: fileCategoryForMimeType(file.type),
  });
}
