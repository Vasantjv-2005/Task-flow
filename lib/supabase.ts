import { createClient } from "@supabase/supabase-js"

// Environment variables with hardcoded fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xujhgoldqdlxbrdfzvfz.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1amhnb2xkcWRseGJyZGZ6dmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTAwMDgsImV4cCI6MjA3MDI4NjAwOH0.uYdEzOJWDZrfkL9kl-mclWq4ERimucOLGMzL6Wb8trg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Database = {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      board_members: {
        Row: {
          id: string
          board_id: string
          user_id: string
          role: "owner" | "member"
          joined_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          role?: "owner" | "member"
          joined_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          role?: "owner" | "member"
          joined_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          board_id: string
          title: string
          description: string | null
          status: "todo" | "in-progress" | "done"
          assignee_id: string | null
          created_by: string
          attachment_url: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          description?: string | null
          status?: "todo" | "in-progress" | "done"
          assignee_id?: string | null
          created_by: string
          attachment_url?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          description?: string | null
          status?: "todo" | "in-progress" | "done"
          assignee_id?: string | null
          created_by?: string
          attachment_url?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
