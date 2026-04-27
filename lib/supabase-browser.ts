import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseBrowserClient() {
  const env = getBrowserEnv();

  if (!env) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(env.url, env.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  return browserClient;
}

export function hasSupabaseBrowserEnv() {
  return Boolean(getBrowserEnv());
}
