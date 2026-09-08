-- Adds invite columns to investors for the website-hosted onboarding flow.
-- Run once in Supabase SQL Editor.

alter table public.investors
  add column if not exists invite_token text,
  add column if not exists invite_otp text;

create unique index if not exists investors_invite_token_uniq
  on public.investors(invite_token)
  where invite_token is not null;
