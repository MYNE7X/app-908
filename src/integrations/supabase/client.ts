import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) throw new Error("Supabase client not initialized. Call initSupabase() first.");
  return _client;
}

export async function initSupabase(): Promise<void> {
  if (_client) return;

  const builtInUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const builtInKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

  let supabaseUrl: string;
  let supabaseAnonKey: string;

  if (builtInUrl && builtInKey) {
    supabaseUrl = builtInUrl;
    supabaseAnonKey = builtInKey;
  } else {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Failed to load app configuration");
    const data = await res.json();
    supabaseUrl = data.supabaseUrl;
    supabaseAnonKey = data.supabaseAnonKey;
  }

  _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop: string) {
    return getSupabase()[prop as keyof SupabaseClient<Database>];
  },
});
