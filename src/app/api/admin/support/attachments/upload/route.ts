import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAllowedAttachmentType, fileCategoryForMimeType, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/supportUtils";

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const threadId = formData.get("threadId") as string | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
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
