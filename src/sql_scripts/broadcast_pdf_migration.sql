-- ============================================================
-- Broadcast PDF Attachments
-- ============================================================
-- Mirrors broadcast_video_migration.sql — one PDF per broadcast, uploaded
-- directly from the browser to Supabase Storage via a signed upload URL
-- (see /api/admin/broadcast/upload-pdf), never routed through our
-- Next.js server. Shares the same /v/:code short-link mechanism as video
-- (src/app/v/[code]/route.ts already resolves either code).
--
-- Unlike video, PDFs are NOT compressed before upload — no reliable
-- client-side PDF compressor exists (nothing comparable to ffmpeg.wasm),
-- so this is capped at 20MB raw instead.
-- ============================================================

ALTER TABLE broadcast_logs ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE broadcast_logs ADD COLUMN IF NOT EXISTS pdf_short_code TEXT UNIQUE;

-- file_size_limit is in bytes — 20971520 = 20MB.
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'broadcast-pdfs',
  'broadcast-pdfs',
  true,
  ARRAY['application/pdf'],
  20971520
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
