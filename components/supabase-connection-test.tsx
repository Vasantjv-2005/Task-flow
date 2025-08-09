"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }

      // Test if we can access auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError && !userError.message.includes("session_not_found")) {
        throw new Error(`Auth error: ${userError.message}`)
      }

      setConnectionStatus("connected")
      setAuthEnabled(true)
    } catch (err: any) {
      setConnectionStatus("error")
      setError(err.message)
      setAuthEnabled(false)
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = `test${Date.now()}@gmail.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "password123",
        options: {
          data: {
            full_name: "Test User",
          },
        },
      })

      console.log("Test signup result:", { data, error })

      if (error) {
        alert(`Signup test failed: ${error.message}`)
      } else {
        alert(`Signup test successful! User created: ${testEmail}`)
      }
    } catch (err: any) {
      alert(`Signup test error: ${err.message}`)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Test
          {connectionStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {connectionStatus === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
          {connectionStatus === "error" && <XCircle className="h-4 w-4 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Connection:</span>
          <Badge
            variant={
              connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"
            }
          >
            {connectionStatus === "loading" && "Testing..."}
            {connectionStatus === "connected" && "Connected"}
            {connectionStatus === "error" && "Error"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Auth Enabled:</span>
          <Badge variant={authEnabled ? "default" : "destructive"}>{authEnabled ? "Yes" : "No"}</Badge>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Button onClick={testSignUp} className="w-full" size="sm">
          Test Signup Function
        </Button>

        <Button onClick={testConnection} variant="outline" className="w-full bg-transparent" size="sm">
          Retry Connection Test
        </Button>
      </CardContent>
    </Card>
  )
}
