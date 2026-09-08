-- ============================================================
-- Broadcast Video Attachments
-- ============================================================
-- Adds the ability to attach one video to a broadcast (email CTA +
-- WhatsApp link), uploaded directly from the browser to Supabase
-- Storage via a signed upload URL (see /api/admin/broadcast/upload-video).
--
-- Videos are capped at 50MB, enforced in three layers (defense in depth):
--   1. Client-side, before compression/upload even starts (broadcasts/page.tsx)
--   2. Server-side, on the declared file size (upload-video/route.ts) —
--      catches a modified client, though it can still lie about the size
--   3. This bucket's file_size_limit below — the real backstop, since
--      Supabase itself rejects anything over it regardless of what the
--      client claims.
--
-- Also note the separate project-wide "Upload file size limit"
-- (Supabase Dashboard → Project Settings → Storage) must be >= 50MB too —
-- whichever of that setting and this bucket's limit is smaller wins. On
-- the Free plan that project-wide limit is hard-capped at 50MB anyway, so
-- this only matters if you later raise the cap in code.
-- ============================================================

-- 1. Track the attached video on the broadcast log row.
ALTER TABLE broadcast_logs ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Dedicated public bucket for broadcast videos (mirrors the existing
--    broadcast-images bucket). Public so links embedded in outbound
--    emails/WhatsApp messages resolve without a signed download URL.
--    file_size_limit is in bytes — 52428800 = 50MB.
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'broadcast-videos',
  'broadcast-videos',
  true,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
  52428800
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
