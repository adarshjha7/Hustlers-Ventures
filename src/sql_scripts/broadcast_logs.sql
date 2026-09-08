-- ============================================================
-- Broadcast Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT NOT NULL,
  body             TEXT NOT NULL,
  image_urls       JSONB,           -- ["https://..."] embedded in email
  recipient_filter JSONB NOT NULL,  -- {type: "all"|"pool"|"active"|"exited"|"custom", value: "..."}
  recipient_count  INT NOT NULL DEFAULT 0,
  sent_count       INT NOT NULL DEFAULT 0,
  failed_count     INT NOT NULL DEFAULT 0,
  results          JSONB,           -- [{investor_id, name, email, status, error}]
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;
-- Admin-only via service role — no RLS policies needed for investors
