import { createClient } from "@supabase/supabase-js";

// Service role client - bypasses RLS. Server-side only, never import in client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Function form - kept for code that prefers explicit instantiation.
export function createAdminClient() {
  return supabaseAdmin;
}
