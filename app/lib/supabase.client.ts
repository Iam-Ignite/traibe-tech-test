import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = typeof window !== "undefined" ? window.ENV?.SUPABASE_URL : "";
const supabaseAnonKey = typeof window !== "undefined" ? window.ENV?.SUPABASE_ANON_KEY : "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;
