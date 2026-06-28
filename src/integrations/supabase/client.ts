import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://mirhamzbvpcvgkfvuvun.supabase.co";

const SUPABASE_ANON_KEY = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
) ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcmhhbXpidnBjdmdrZnZ1dnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTg3MDUsImV4cCI6MjA5NTc3NDcwNX0.kzLb1BsSd-0xCpaGh8HbfFdmF6uIA0aDL6yU64dy3X4";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

export async function initSupabase(): Promise<void> {
  getSupabase();
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop: string) {
    return getSupabase()[prop as keyof SupabaseClient<Database>];
  },
});
