import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv, hasSupabase } from "@/lib/env";

/** Browser / client components — anon key only. Returns null if env unset. */
export function createBrowserClient(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Server-only service-role client (bypasses RLS).
 * Never import this from client components.
 */
export function createServiceClient(): SupabaseClient | null {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { hasSupabase };
