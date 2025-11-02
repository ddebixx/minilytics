import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazily create an admin client using service role on the server only
let adminClient: SupabaseClient | null = null;

export function getAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Do not throw during build/import; throw when actually used on server
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to your .env.local."
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return adminClient;
}
