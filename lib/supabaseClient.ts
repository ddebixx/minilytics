import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Browser-side client using anon key for auth (lazy initialization)
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to your .env.local."
    );
  }

  // Use SSR browser client for proper cookie handling
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return browserClient;
}

// Convenience export for backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});
