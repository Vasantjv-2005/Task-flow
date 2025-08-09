"use client"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

// Environment variables with fallbacks and validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xujhgoldqdlxbrdfzvfz.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1amhnb2xkcWRseGJyZGZ6dmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTAwMDgsImV4cCI6MjA3MDI4NjAwOH0.uYdEzOJWDZrfkL9kl-mclWq4ERimucOLGMzL6Wb8trg"

// Debug logging
console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key (first 20 chars):", supabaseAnonKey.substring(0, 20) + "...")

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Singleton pattern for client-side Supabase client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()

// Test connection on load
supabase.auth.getSession().then(({ data, error }) => {
  console.log("Initial session check:", { data, error })
})
