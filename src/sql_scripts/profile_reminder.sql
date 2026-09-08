-- Tracks when we last sent a "complete your profile" reminder to an investor.
-- Used to avoid spamming when the cron + manual button both run.

alter table public.investors
  add column if not exists profile_reminder_sent_at timestamptz;
