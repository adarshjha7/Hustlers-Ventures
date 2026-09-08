-- Referral Interest — early access sign-ups
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS referral_interest (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  investor_id uuid REFERENCES investors(investor_id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Investors can only read/write their own row; admin uses service role
ALTER TABLE referral_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investors_own_row" ON referral_interest
  FOR ALL USING (auth.uid() = user_id);
