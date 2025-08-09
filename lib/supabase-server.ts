import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xujhgoldqdlxbrdfzvfz.supabase.co"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1amhnb2xkcWRseGJyZGZ6dmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTAwMDgsImV4cCI6MjA3MDI4NjAwOH0.uYdEzOJWDZrfkL9kl-mclWq4ERimucOLGMzL6Wb8trg"

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)
