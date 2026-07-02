// Supabase client (README build order step 2: "add Supabase for auth + sync").
//
// The client is created lazily and only when both env vars are present, so the
// app runs fully in local-only mode with no backend configured. When you're
// ready to turn on cloud sync:
//   1. Create a Supabase project and run supabase/schema.sql.
//   2. Copy .env.example → .env and fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
//   3. Build the sync repository against `supabase` here (see README TODO).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
