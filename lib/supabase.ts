import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface CardRecord {
  id: string;
  name: string;
  role: string;
  socials: Record<string, string | undefined>;
  builder_number: number;
  portrait_url: string;
  portrait_back_url: string | null;
  landscape_url: string;
  created_at: string;
}

let client: SupabaseClient | null = null;

/** Null when Supabase env vars aren't set yet — callers should degrade
 * gracefully (client-side share flow keeps working without a backend). */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
