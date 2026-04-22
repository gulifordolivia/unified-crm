import { createClient } from "@supabase/supabase-js";

function getServerEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function getSupabaseServerClient() {
  const env = getServerEnv();

  if (!env) {
    return null;
  }

  return createClient(env.url, env.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hasSupabaseServerEnv() {
  return Boolean(getServerEnv());
}
