import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient<Database>(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export function publicMediaUrl(storagePath: string | null | undefined, bucket = "blog-media") {
  if (!storagePath) return null;
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}
