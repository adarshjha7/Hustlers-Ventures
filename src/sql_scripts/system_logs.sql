CREATE TABLE system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level TEXT NOT NULL, -- Will store 'INFO', 'WARN', or 'ERROR'
  message TEXT NOT NULL,
  metadata JSONB, -- Will store user IDs, error details, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) so only the service role/admin can read these logs, 
-- but the authenticated users/anon can insert them if needed.
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a log
CREATE POLICY "Enable insert for all users" ON system_logs
  FOR INSERT WITH CHECK (true);

-- Only admins/service role can view logs (prevents users from reading the log table)
CREATE POLICY "Enable read access for admins only" ON system_logs
  FOR SELECT USING (auth.role() = 'service_role');