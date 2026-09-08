-- Email open tracking
-- Run once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.email_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type  text        NOT NULL,  -- 'welcome', 'broadcast'
  ref_id      text,                  -- broadcast_log_id UUID (broadcasts) or base64(email) (welcome)
  uid         text,                  -- base64url(email) — who opened; same as ref_id for welcome
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only service role can read/write (admin queries via supabaseAdmin)
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS email_events_type_ref_idx ON public.email_events(email_type, ref_id);
CREATE INDEX IF NOT EXISTS email_events_uid_idx       ON public.email_events(uid);
CREATE INDEX IF NOT EXISTS email_events_created_at_idx ON public.email_events(created_at DESC);
