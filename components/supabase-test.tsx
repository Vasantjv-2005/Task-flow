"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        throw error
      }

      setConnectionStatus("connected")
    } catch (err: any) {
      setConnectionStatus("error")
      setError(err.message)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Status
          {connectionStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {connectionStatus === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
          {connectionStatus === "error" && <XCircle className="h-4 w-4 text-red-500" />}
        </CardTitle>
        <CardDescription>Testing connection to your Supabase project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "default"
                  : connectionStatus === "error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {connectionStatus === "loading" && "Testing..."}
              {connectionStatus === "connected" && "Connected"}
              {connectionStatus === "error" && "Error"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Project URL:</span>
            <span className="text-xs text-muted-foreground">xujhgoldqdlxbrdfzvfz.supabase.co</span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                <strong>Error:</strong> {error}
              </p>
              <p className="text-xs text-red-500 mt-1">
                Make sure you've run the SQL scripts in your Supabase project.
              </p>
            </div>
          )}

          {connectionStatus === "connected" && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">✅ Successfully connected to Supabase!</p>
              <p className="text-xs text-green-500 mt-1">Your TaskFlow app is ready to use.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
