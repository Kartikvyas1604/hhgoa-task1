import "server-only";
import { getSupabase, type CardRecord } from "@/lib/supabase";

export async function getCard(id: string): Promise<CardRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("cards").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as CardRecord;
}
